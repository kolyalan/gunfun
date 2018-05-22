'use strict'

if (!Date.now) {
  Date.now = function now() {
    return new Date().getTime();
  };
}

/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
function random(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var game = new Phaser.Game(1000, 600, Phaser.AUTO, "game-field", {preload:preload, create:create, update:update, render:render});

function Weapon(player_sprite, num_bullets, bullet_speed, fire_rate, max_coll, reloading_time) {
    this.player_sprite = player_sprite;
	this.bullets = [];
	this.bullet_ind = 0;
	this.num_bullets = num_bullets;
	this.bullet_speed = bullet_speed;
	this.fire_rate = fire_rate;
	this.prev_fire = -1000;
	this.bullets_in_row = 0;
	this.max_coll = max_coll;
    this.needs_reload = false;
    this.reloading_time = reloading_time;
    this.reloading = false;
	for(let i = 0; i < num_bullets; i++) {
		let bullet = game.add.sprite(0, 0, 'bullet');
		game.physics.p2.enable(bullet, false);
		bullet.body.dynamic = true;
		bullet.anchor.setTo(0.5, 0.5);
		bullet.body.damping = 0; //part of velocity losed per second [0..1];
		bullet.body.setCircle(7);
		bullet.body.fixedRotation = false;
		bullet.kill();
		bullet.body.onBeginContact.add(this.bulletHit, this, 0, bullet);
		bullet.countHit = 0;//еще не ударялась.
		this.bullets.push(bullet);
	}
}

Weapon.prototype.bulletHit = function(body, bodyB, shapeA, shapeB, equation, bullet) { // обработчик касания пули с объектом body
	bullet.countHit += 1;
	if(bullet.countHit > this.max_coll) {
		bullet.kill();
		return;
	}
	if (body) {//hit
		dbg = "body:" + body.sprite.key + " bodyB: " + bodyB.sprite;

	} else { //bullet hit the wall
		dbg = "bullet hit the wall";
	}

}

Weapon.prototype.fire = function() {
    if(this.needs_reload) {
        return;
    }
	let ms = Date.now();
	//console.log(ms, this.prev_fire);
	if(ms - this.prev_fire >= this.fire_rate) {
		if(this.prev_fire != -1000) {
			this.bullets_in_row++;
		}
		else {
			this.bullets_in_row = 0;
		}

		this.prev_fire = ms;

		let bullet = this.bullets[this.bullet_ind];
		let angle_variance = 0;
		if(this.bullets_in_row <= 6) {
	 		angle_variance = 0.05*this.bullets_in_row;
		}
		else {
			angle_variance = 0.05*6;
		}

		bullet.countHit = 0;
		bullet.body.rotation = this.player_sprite.body.rotation;
		bullet.body.x = this.player_sprite.body.x + 93*Math.cos(bullet.body.rotation);
		bullet.body.y = this.player_sprite.body.y + 93*Math.sin(bullet.body.rotation);
		bullet.body.moveRight(this.bullet_speed*(Math.cos(bullet.body.rotation) + random(-angle_variance, angle_variance)));
		bullet.body.moveDown(this.bullet_speed*(Math.sin(bullet.body.rotation) + random(-angle_variance, angle_variance)));
		bullet.revive();

		this.bullet_ind++;
		if(this.bullet_ind == this.num_bullets) {
			this.bullet_ind = 0;
            this.needs_reload = true;
            console.log('Yes!');
		}
	}
};

Weapon.prototype.null_fire = function() {
	this.prev_fire = -1000;
};

Weapon.prototype.update = function() {
	for(let i = 0; i < this.num_bullets; i++) {
		bullet = this.bullets[i];
		if(bullet.alive) {
			bullet.body.rotation = Math.atan2(bullet.body.velocity.y, bullet.body.velocity.x);
			//console.log(bullet.body.rotation);
		}
	}
};

function Player(sprite_name, weapon_settings) {
    this.player_sprite = game.add.sprite(0, 0, sprite_name);
	game.physics.p2.enable(this.player_sprite, true);//true - debug
	this.player_sprite.frame = 1;
	this.player_sprite.animations.add('go', [1, 0, 1, 2], 7, true);
	this.player_sprite.enableBody = true;
	this.player_sprite.body.collideWorldBounds = true;
	this.player_sprite.anchor.setTo(0.45, 0.54);
	this.player_sprite.body.setCircle(65);

    let {num_bullets, bullet_speed, fire_rate, max_coll, reloading_time} = weapon_settings;
	this.weapon = new Weapon(this.player_sprite, num_bullets, bullet_speed, fire_rate, max_coll, reloading_time);
}

Player.prototype.update = function() {
    this.player_sprite.body.setZeroVelocity();
	var vx = 0, vy = 0;
    if(this.weapon.reloading && (Date.now() - this.weapon.reloading_start >= this.weapon.reloading_time)) {
        this.weapon.reloading = false;
        this.weapon.needs_reload = false;
    }
    if(game.input.keyboard.isDown(Phaser.Keyboard.R) && !this.weapon.reloading) {
        this.weapon.reloading = true;
        this.weapon.reloading_start = Date.now();
        console.log('Reloading!', this.weapon.reloading_start)
    }
	if (cursors.left.isDown || game.input.keyboard.isDown(Phaser.Keyboard.A)) {
		this.player_sprite.animations.play('go');
        vx = -1;
    }
    else if (cursors.right.isDown || game.input.keyboard.isDown(Phaser.Keyboard.D)) {
		this.player_sprite.animations.play('go');
        vx = 1;
    }
    if (cursors.up.isDown || game.input.keyboard.isDown(Phaser.Keyboard.W)) {
		this.player_sprite.animations.play('go');
		vy = -1;
    }
    else if (cursors.down.isDown || game.input.keyboard.isDown(Phaser.Keyboard.S)) {
		this.player_sprite.animations.play('go');
		vy = 1;
    }
    if (vx != 0 && vy != 0) {
		this.player_sprite.body.moveDown(vy*vel/sq2);
		this.player_sprite.body.moveRight(vx*vel/sq2);
	} else {
		this.player_sprite.body.moveDown(vy*vel);
		this.player_sprite.body.moveRight(vx*vel);
	}
    if(this.player_sprite.body.velocity.x == 0 && this.player_sprite.body.velocity.y == 0) {
		this.player_sprite.animations.stop();
        this.player_sprite.frame = 1;
	}

    this.player_sprite.body.rotation = game.physics.arcade.angleToPointer(this.player_sprite);

	this.weapon.update();
    if(game.input.activePointer.leftButton.isDown) {
        this.weapon.fire();
    }
	else {
		this.weapon.null_fire();
	}
}

Player.prototype.render = function() {
    if(this.weapon.needs_reload) {
        game.debug.text("Need reload!", 32, 100);
    }
}

function preload () {
	game.load.spritesheet('player1_sprite', 'chelik.png', 174, 100);
	game.load.image('box', 'box0.png');
	game.load.image('bullet', 'sprites/bullet.png');
}

var PI = 3.1414926535;
var sq2 = Math.sqrt(2);
var vel = 300;
var bullet_live = 5;
var player1;
var cursors;
var boxes;
var b0, b1;
var weapon, fire_button;
var bullet;
var dbg = "Nothing happened";

function create() {
	game.time.advancedTiming = true;
	game.input.mouse.capture = true;
	game.physics.startSystem(Phaser.Physics.P2JS);
	game.physics.p2.restitution = 0.8;
	game.stage.backgroundColor = "#EEEEEE";

    // 30, 800, 60, 3, 2000
	player1 = new Player('player1_sprite', {
        num_bullets: 30,
        bullet_speed: 800,
        fire_rate: 60,
        max_coll: 3,
        reloading_time: 2000
    });

	cursors = game.input.keyboard.createCursorKeys();
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.A ]);
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.S ]);
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.D ]);
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.W ]);
    game.input.keyboard.addKeyCapture([ Phaser.Keyboard.R ]);

	boxes = game.add.physicsGroup(Phaser.Physics.P2JS);
	var b0 = boxes.create(400, 200, 'box');//случайные координаты где-то в середине.
	b0.anchor.setTo(0.5, 0.5);
	b0.body.kinematic = true;
	b0.body.rotation = 0.8243;//случайное, вообще-то число
	var b1 = boxes.create(500, 400, 'box');//случайные координаты где-то в середине.
	b1.anchor.setTo(0.5, 0.5);
	b1.body.kinematic = true;
	b1.body.rotation = 1.8243;//случайное, вообще-то число
}

function update() {
	player1.update();
}

function render() {
    player1.render();
	game.debug.text(dbg, 32, 32);
	game.debug.text(game.time.fps, 2, 14, "#00ff00");
	game.debug.body(player1.player_sprite);
}
