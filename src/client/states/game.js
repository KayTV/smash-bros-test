var socket = io();

var players = [];
var bullets;

function Game () {
  this.bullets;
  this.player1 = null;
  this.player2 = null;
  this.playerCount;
  this.platforms;
  this.cursors;
  this.fireButton;
  this.fireRate = 100;
  this.nextFire = 0;
  this.bulletTime = 0;
  this.right = false;
}

Game.prototype = {
  init: function (playerCount) {
    this.playerCount = playerCount;
    console.log("playerCount:", playerCount);
    this.game.renderer.renderSession.roundPixels = true;
    this.game.stage.disableVisibilityChange = true;
    this.physics.startSystem(Phaser.Physics.ARCADE);
    socket.on('connect', function(){
      console.log('connected');
    })
  },

  preload: function() {

  },
  create: function() {
    this.add.sprite(0, 0, 'sky');
    this.platforms = this.add.group();

    //  We will enable physics for any object that is created in this group
    this.platforms.enableBody = true;

    // Here we create the ground.
    var ground = this.platforms.create(0, this.world.height - 64, 'ground');

    //  This stops it from falling away when you jump on it
    ground.body.immovable = true;

    var ledge = this.platforms.create(250, 350, 'box');
    ledge.body.immovable = true;

    ledge = this.platforms.create(650, 100, 'box');
    ledge.body.immovable = true;

    ledge = this.platforms.create(100, 350, 'littlebox');
    ledge.body.immovable = true;

		ledge = this.platforms.create(350, 200, 'littlebox');
    ledge.body.immovable = true;

		ledge = this.platforms.create(580, 450, 'pipe');
    ledge.body.immovable = true;

    // Player1/Player and settings
    this.player1 = this.add.sprite(32, this.world.height - 150, 'dude');
    this.player2 = this.add.sprite(200, this.world.height - 150, 'kirby');
    this.player2.scale.setTo(1.5,1.5);

    //  We need to enable physics on the player1
		this.player1.anchor.set(0.5);
    this.player2.anchor.set(2);

    this.physics.enable(this.player1, Phaser.Physics.ARCADE);
    this.physics.enable(this.player2, Phaser.Physics.ARCADE);

    //  Player physics properties. Give the little guy a slight bounce.
    this.player1.body.bounce.y = 0.2;
    this.player1.body.gravity.y = 300;
    this.player1.body.collideWorldBounds = true;

    this.player2.body.bounce.y = 0.2;
    this.player2.body.gravity.y = 300;
    this.player2.body.collideWorldBounds = true;

    this.player1.animations.add('left', [0, 1, 2, 3], 13, true);
    this.player1.animations.add('right', [6, 7, 8, 9], 13, true);
		this.player1.animations.add('jump', [10], 13, true);
		this.player1.animations.add('jumpdown', [11], 13, true);
    this.player1.animations.add('hit', [12], 13, true);

    // this.player2.animations.add('left', [0, 1, 2, 3], 13, true);
    // this.player2.animations.add('right', [6, 7, 8, 9], 13, true);
		// this.player2.animations.add('jump', [10], 13, true);

    // console.log('player', this.player1);

    //bullets for megaman
		this.bullets = this.add.group();
    this.bullets.enableBody = true;
    this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
    this.bullets.setAll('anchor.x', 0.5);
    this.bullets.setAll('anchor.y', 1);
    this.bullets.createMultiple(50, 'bullet');
    this.bullets.setAll('checkWorldBounds', true);
    this.bullets.setAll('outOfBoundsKill', true);

    //  Our controls.
    this.cursors = this.input.keyboard.createCursorKeys();
		this.fireButton = this.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

  },
  update: function() {
    //  Collide the player with platforms
    this.physics.arcade.collide(this.player1, this.platforms);
    this.physics.arcade.collide(this.player1, this.moveBox, this.customSep, null, this);

    this.physics.arcade.collide(this.player2, this.platforms);
    this.physics.arcade.collide(this.player2, this.moveBox, this.customSep, null, this);

    var standing = this.player1.body.blocked.down || this.player1.body.touching.down || this.locked;

    //  Reset the player1s velocity (movement)
    this.player1.body.velocity.x = 0;

    var self = this;
    socket.on('game-update', function(data) {
      self.right = data.right;
      self.left = data.left;
      self.jump = data.jump;
      self.fire = data.fire;
    })

    if (this.cursors.left.isDown || this.left === true)
    {
        //  Move to the left
        this.player1.body.velocity.x = -150;
        this.player1.animations.play('left');
    }
    else if ( this.cursors.right.isDown || this.right === true)
    {
        //  Move to the right
        this.player1.body.velocity.x = 150;
        this.player1.animations.play('right');
    }
		else if(this.cursors.up.isDown || this.jump === true)
		{
			this.player1.animations.play('jump');
		}
    else
    {
      //  Stand still
      this.player1.animations.stop();
      this.player1.frame = 5;
    }
    if(this.fireButton.isDown || this.fire === true)
		{
			this.fire();
		}
    //  Allow the player1 to jump if they are touching the ground.
    if (this.cursors.up.isDown && this.player1.body.touching.down)
    {
        this.player1.body.velocity.y = -350;
    }

  },
  fire: function() {
    if (this.time.now > this.nextFire && this.bullets.countDead() > 0)
    {
        this.nextFire = this.time.now + this.fireRate;

        var bullet = this.bullets.getFirstDead();

        bullet.reset(this.player1.x, this.player1.y);
        if(this.cursors.right.isDown || this.cursors.up.isDown) {
          bullet.body.velocity.x = 400;
        }
        if(this.cursors.left.isDown || this.cursors.down.isDown) {
          bullet.body.velocity.x = -400;
        }
        else {
          bullet.body.velocity.x = 400;
        }
        // this.physics.arcade.moveToXY(bullet, 500, 500, 400);
    }
  },
}

CloudPlatform = function (game, x, y, key, group) {
    if (typeof group === 'undefined') { group = game.world; }
    Phaser.Sprite.call(this, game, x, y, key);
    game.physics.arcade.enable(this);
    this.anchor.x = 0.5;
    this.body.customSeparateX = true;
    this.body.customSeparateY = true;
    this.body.allowGravity = false;
    this.body.immovable = true;
    this.playerLocked = false;
    group.add(this);
};

CloudPlatform.prototype = Object.create(Phaser.Sprite.prototype);
CloudPlatform.prototype.constructor = CloudPlatform;
CloudPlatform.prototype.addMotionPath = function (motionPath) {
    this.tweenX = this.game.add.tween(this.body);
    this.tweenY = this.game.add.tween(this.body);

    for (var i = 0; i < motionPath.length; i++)
    {
        this.tweenX.to( { x: motionPath[i].x }, motionPath[i].xSpeed, motionPath[i].xEase);
        this.tweenY.to( { y: motionPath[i].y }, motionPath[i].ySpeed, motionPath[i].yEase);
    }
    this.tweenX.loop();
    this.tweenY.loop();
};
CloudPlatform.prototype.start = function () {
    this.tweenX.start();
    this.tweenY.start();
};
CloudPlatform.prototype.stop = function () {
    this.tweenX.stop();
    this.tweenY.stop();
};
