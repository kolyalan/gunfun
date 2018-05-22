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

function Weapon(num_bullets, bullet_speed, fire_rate, max_coll) {
	this.bullets = [];
	this.bullet_ind = 0;
	this.num_bullets = num_bullets;
	this.bullet_speed = bullet_speed;
	this.fire_rate = fire_rate;
	this.prev_fire = -1000;
	this.bullets_in_row = 0;
	this.max_coll = max_coll;
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
		dbg = "body:" + body.id + " bodyB: " + bodyB.sprite;

	} else { //bullet hit the wall
		dbg = "bullet hit the wall";
	}

}

Weapon.prototype.fire = function() {
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
		bullet.body.rotation = player1.body.rotation;
		bullet.body.x = player1.body.x + 93*Math.cos(bullet.body.rotation);
		bullet.body.y = player1.body.y + 93*Math.sin(bullet.body.rotation);
		bullet.body.moveRight(this.bullet_speed*(Math.cos(bullet.body.rotation) + random(-angle_variance, angle_variance)));
		bullet.body.moveDown(this.bullet_speed*(Math.sin(bullet.body.rotation) + random(-angle_variance, angle_variance)));
		bullet.revive();

		this.bullet_ind++;
		if(this.bullet_ind == this.num_bullets) {
			this.bullet_ind = 0;
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

function preload () {
	game.load.spritesheet('image', 'chelik.png', 174, 100);
	game.load.image('box', 'box0.png');
	game.load.image('triangle', 'triangle.png');
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


	player1 = game.add.sprite(65, 65, 'image');
	game.physics.p2.enable(player1, false);//true - debug
	player1.frame = 1;
	player1.animations.add('go', [1, 0, 1, 2], 7, true);
	player1.enableBody = true;
	player1.body.collideWorldBounds = true;
	player1.anchor.setTo(0.45, 0.54);
	player1.body.setCircle(65);

	weapon = new Weapon(30, 800, 60, 3);

	cursors = game.input.keyboard.createCursorKeys();
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.A ]);
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.S ]);
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.D ]);
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.W ]);

	generateField(16, 2, 165);
}

function generateField(nb, nt, offset) {	//nb и nt - четные.
	boxes = game.add.physicsGroup(Phaser.Physics.P2JS);
	for (let i = 0; i < nb/2; i++) {
		var x, y, good;
		good = 0;
		while(!good) {
			x = getRandomInt(offset, game.width/2-30);
			y = getRandomInt(offset, game.height-offset);
			good = 1;
			boxes.forEach(function(box, x, y) {
				if (Math.hypot(x-box.x, y-box.y)< 90) {
					good = 0;
				}
			}, this, true, x, y);
			if (good) break;
		}
		var angle = getRandomInt(0, PI);
		var width = 30 + random(-15, 10);
		var height = 70 + random(-30, 10);
		var box = boxes.create(x, y, 'box');
		box.width = width;
		box.height = height;
		box.body.kinematic = true;
		//box.body.debug = true;
		box.body.setRectangleFromSprite();
		box.body.rotation = angle;
		box = boxes.create(game.width - x, game.height-y, 'box');
		box.width = width;
		box.height = height;
		box.body.kinematic = true;
		//box.body.debug = true;
		box.body.setRectangleFromSprite();
		box.body.rotation = angle;
	}/*
	for (let i = 0; i < nt/2; i++) {
		var x, y, good;
		good = 0;
		while(!good) {
			x = getRandomInt(offset, game.width/2-30);
			y = getRandomInt(offset, game.height-offset);
			good = 1;
			boxes.forEach(function(box, x, y) {
				if (Math.hypot(x-box.x, y-box.y)< 90) {
					good = 0;
				}
			}, this, true, x, y);
			if (good) break;
		}
		var angle = getRandomInt(0, PI);
		var width = 70 + random(-15, 10);
		var height = 70 + random(-30, 10);
		var box = boxes.create(x, y, 'triangle');
		box.body.debug = true;
		box.body.kinematic = true;
		box.body.clearShapes();
		box.body.addPolygon([], [[0, 70], [70, 70], [35, 10]]);
		box.anchor.setTo(0.5, 0.7);
		box.body.rotation = angle;
		box = boxes.create(game.width - x, game.height-y, 'triangle');
		box.body.debug = true;
		box.body.kinematic = true;
		box.body.addPolygon([], [[0, 70], [70, 70], [35, 10]]);
		box.anchor.setTo(0.5, 0.7);
		box.body.rotation = PI +angle;
	}*/
}

function update() {
	player1.body.setZeroVelocity();
	var vx = 0, vy = 0;
	if (cursors.left.isDown || game.input.keyboard.isDown(Phaser.Keyboard.A))
    {
		player1.animations.play('go');
        vx = -1;
    }
    else if (cursors.right.isDown || game.input.keyboard.isDown(Phaser.Keyboard.D))
    {
		player1.animations.play('go');
        vx = 1;
    }
    if (cursors.up.isDown || game.input.keyboard.isDown(Phaser.Keyboard.W))
    {
		player1.animations.play('go');
		vy = -1;
    }
    else if (cursors.down.isDown || game.input.keyboard.isDown(Phaser.Keyboard.S))
    {
		player1.animations.play('go');
		vy = 1;
    }
    if (vx != 0 && vy != 0) {
		player1.body.moveDown(vy*vel/sq2);
		player1.body.moveRight(vx*vel/sq2);
	} else {
		player1.body.moveDown(vy*vel);
		player1.body.moveRight(vx*vel);
	}
    if(player1.body.velocity.x == 0 && player1.body.velocity.y == 0) {
		player1.animations.stop();
        player1.frame = 1;
	}
	/*костыль для дебага
	if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
		bullet.kill();
	}
	*/
    player1.body.rotation = game.physics.arcade.angleToPointer(player1);

	weapon.update();
    if(game.input.activePointer.leftButton.isDown) {
        weapon.fire();
    }
	else {
		weapon.null_fire();
	}
}

function render() {
	game.debug.text(dbg, 32, 32);
	game.debug.text(game.time.fps, 2, 14, "#00ff00");
	game.debug.body(player1);
}
