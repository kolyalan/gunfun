'use strict'

if (!Date.now) {
  Date.now = function now() {
    return new Date().getTime();
  };
}

Function.prototype.clone = function() {
    var that = this;
    var temp = function temporary() { return that.apply(this, arguments); };
    for(var key in this) {
        if (this.hasOwnProperty(key)) {
            temp[key] = this[key];
        }
    }
    return temp;
};


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

var game = new Phaser.Game(window.screen.availWidth, window.screen.availHeight, Phaser.AUTO, "game-field", {preload:preload, create:create, update:update, render:render});

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
        bullet.name = 'bullet';
		game.physics.p2.enable(bullet, false);
		bullet.body.dynamic = true;
		bullet.anchor.setTo(0.5, 0.5);
		bullet.body.damping = 0; //part of velocity losed per second [0..1];
		bullet.body.setCircle(7);
		bullet.body.fixedRotation = false;
        bullet.body.collideWorldBounds = true;
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
		if (body.isPlayer!=undefined) {
			dbg = "hit player";
			body.sprite.damage(10);
            bullet.kill();
		} else {
			dbg = "body:" + body.sprite.key + " bodyB: " + bodyB.sprite;
		}
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

		this.player_sprite.animations.stop();
		if (this.player_sprite.frame == 0) {
			this.player_sprite.animations.play('fire0');
		} else if (this.player_sprite.frame == 1) {
			this.player_sprite.animations.play('fire1');
		} else if (this.player_sprite.frame == 2) {
			this.player_sprite.animations.play('fire2');
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
		let bullet = this.bullets[i];
		if(bullet.alive) {
			bullet.body.rotation = Math.atan2(bullet.body.velocity.y, bullet.body.velocity.x);
			//console.log(bullet.body.rotation);
		}
	}
};

function Player(sprite_name, weapon_settings, follow_camera, enable_hud, position) {
    let {x, y} = position;
    this.player_sprite = game.add.sprite(x, y, sprite_name);
	game.physics.p2.enable(this.player_sprite, true);//true - debug
	this.player_sprite.frame = 1;
	this.player_sprite.animations.add('go', [1, 0, 1, 2], 7, true);
	this.player_sprite.animations.add('fire0', [3, 0], 10, false);
	this.player_sprite.animations.add('fire1', [4, 1], 10, false);
	this.player_sprite.animations.add('fire2', [5, 2], 10, false);
	this.player_sprite.enableBody = true;
	this.player_sprite.body.collideWorldBounds = true;
	this.player_sprite.anchor.setTo(0.45, 0.54);
	this.player_sprite.body.setCircle(65);
	this.player_sprite.body.isPlayer = 1;
	this.player_sprite.setHealth(100);
    this.player_sprite.name = 'player';
    this.player_sprite.body.mass = 10;

    if(follow_camera) {
        game.camera.follow(this.player_sprite);
    }

    this.weapon_hud = game.add.graphics(0, 0);
    this.weapon_hud.fixedToCamera = true;
    this.enable_hud = enable_hud;


    let {num_bullets, bullet_speed, fire_rate, max_coll, reloading_time} = weapon_settings;
	this.weapon = new Weapon(this.player_sprite, num_bullets, bullet_speed, fire_rate, max_coll, reloading_time);
}

Player.prototype.setXY = function(x, y) {
    this.player_sprite.body.moveDown(x);
    this.player_sprite.body.moveRight(y);
}

Player.prototype.update = function() {
    this.player_sprite.body.setZeroVelocity();
	var vx = 0, vy = 0;
    if(this.weapon.reloading && (Date.now() - this.weapon.reloading_start >= this.weapon.reloading_time)) {
        this.weapon.reloading = false;
        this.weapon.needs_reload = false;
        this.weapon.bullet_ind = 0;
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
    if((this.player_sprite.body.velocity.x == 0) && (this.player_sprite.body.velocity.y == 0)) {
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
    if(!this.enable_hud) {
        return;
    }
    this.weapon_hud.clear();
    this.weapon_hud.lineStyle(2, 0xff0000, 0.5);
    if(this.weapon.reloading) {
        game.debug.text("Reloading...", 32, 65);
    }
    else if(this.weapon.needs_reload) {
        game.debug.text("EMPTY!", 32, 65);
    }
    else {
    //console.log(this.weapon.num_bullets, this.weapon.bullet_ind);
        game.debug.text(this.weapon.num_bullets - this.weapon.bullet_ind, 20, 65);
        for(let i = 0; i < this.weapon.num_bullets - this.weapon.bullet_ind; i++) {
            this.weapon_hud.moveTo(50 + 5*i, 50);
            this.weapon_hud.lineTo(50 + 5*i, 70);
        }
    }
    game.debug.text(this.player_sprite.health, 15, 95);
    this.weapon_hud.lineStyle(10, 0xff0000, 0.5);
    this.weapon_hud.moveTo(50, 90);
    this.weapon_hud.lineTo(50 + 2*this.player_sprite.health, 90);
}

var __point = new Phaser.Point(0, 0);

function intersects(x, y) {
    __point.set(x, y);
    if(game.physics.p2.hitTest(__point).length == 0) {
        return false;
    }
    return true;
}

function get_free_points(n, min_val=0, max_val=-1) {
    let ans = [];
    for (var i = 0; i < n; i++) {
        let x, y;
        do {
            if(max_val == -1) {
                x = getRandomInt(min_val, game.world.width);
                y = getRandomInt(min_val, game.world.height);
            }
            else {
                x = getRandomInt(min_val, max_val);
                y = getRandomInt(min_val, max_val);
            }
        } while(intersects(x, y));
        ans[i] = [x, y];
    }
    return ans;
}

function Bot(sprite_name, weapon_settings, follow_camera, position, player1) {
    this.player1 = player1;
    let {x, y} = position;
    this.player_sprite = game.add.sprite(x, y, sprite_name);
	game.physics.p2.enable(this.player_sprite, true);//true - debug
	this.player_sprite.frame = 1;
	this.player_sprite.animations.add('go', [1, 0, 1, 2], 7, true);
	this.player_sprite.animations.add('fire0', [3, 0], 10, false);
	this.player_sprite.animations.add('fire1', [4, 1], 10, false);
	this.player_sprite.animations.add('fire2', [5, 2], 10, false);
	this.player_sprite.enableBody = true;
	this.player_sprite.body.collideWorldBounds = true;
	this.player_sprite.anchor.setTo(0.45, 0.54);
	this.player_sprite.body.setCircle(65);
	this.player_sprite.body.isPlayer = 1;
	this.player_sprite.setHealth(100);
    this.player_sprite.body.mass = 10;

    this.prev_update = Date.now();

    this.speed = 800;

    if(follow_camera) {
        game.camera.follow(this.player_sprite);
    }

    this.target_x = x;
    this.target_y = y;
    this.shooting = false;


    let {num_bullets, bullet_speed, fire_rate, max_coll, reloading_time} = weapon_settings;
	this.weapon = new Weapon(this.player_sprite, num_bullets, bullet_speed, fire_rate, max_coll, reloading_time);
}

Bot.prototype.update = function() {
    if(!this.player_sprite.alive) {
        return;
    }
    this.player_sprite.body.setZeroVelocity();
    this.player_sprite.body.rotation = game.physics.arcade.angleBetween(this.player_sprite, this.player1.player_sprite);
    let now = Date.now();
    if(now - this.prev_update >= 2000) {
        this.prev_update = now;
        this.target_x = this.player1.player_sprite.x;
        this.target_y = this.player1.player_sprite.y;
    }
    if(this.weapon.reloading && (Date.now() - this.weapon.reloading_start >= this.weapon.reloading_time)) {
        this.weapon.reloading = false;
        this.weapon.needs_reload = false;
    }
    if(this.weapon.needs_reload && !this.weapon.reloading) {
        this.weapon.reloading = true;
        this.weapon.reloading_start = Date.now();
        console.log('Bot Reloading!', this.weapon.reloading_start)
    }
    let pdx = this.player1.player_sprite.x - this.player_sprite.x;
    let pdy = this.player1.player_sprite.y - this.player_sprite.y;
    let dist_to_player = Math.sqrt(pdx*pdx + pdy*pdy);
    if(dist_to_player <= window.screen.availWidth/1.5) {
        this.weapon.fire();
    }
    if((this.target_x != this.player_sprite.x) || (this.target_y != this.player_sprite.y)) {
        this.player_sprite.animations.play('go');
        let dx = this.target_x - this.player_sprite.x, dy = this.target_y - this.player_sprite.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        this.player_sprite.body.moveRight(dx*vel/dist);
        this.player_sprite.body.moveDown(dy*vel/dist);
    }
}

function global_overlap_hook(body1, body2) {
    //console.log('kek');
    if ((body1.sprite.name === 'player' && body2.sprite.name === 'bullet') || (body2.sprite.name === 'player' && body1.sprite.name === 'bullet')) {
        if(body1.sprite.name === 'player') {
            body1.sprite.damage(5);
        }
        else {
            body2.sprite.damage(5);
        }
        //dosomething();  //whatever you need on overlap
        return false;
    }
    return true;
}


function preload () {
	game.load.spritesheet('player1_sprite', 'chelik_vertikalny.png', 174, 100);
	game.load.image('box', 'box0.png');
	game.load.image('bullet', 'sprites/bullet.png');
}

var PI = 3.1414926535;
var sq2 = Math.sqrt(2);
var vel = 300;
var player1, player2, bot1, bot2;
var cursors;
var boxes;
var b0, b1;
var weapon, fire_button;
var dbg = "Nothing happened";

function generate_field(nb, nt, offset) {	//nb и nt - четные.
    boxes = game.add.physicsGroup(Phaser.Physics.P2JS);
    for (let i = 0; i < nb; i++) {
        var x, y, good;
        good = 0;
        while(!good) {
            x = getRandomInt(offset, game.world.width/2-30);
            y = getRandomInt(offset, game.world.height-offset);
            good = 1;
            boxes.forEach(function(box, x, y) {
                if (Math.hypot(x-box.x, y-box.y)< 90) {
                    good = 0;
                }
            }, this, true, x, y);
            if (good) break;
        }
        var angle = getRandomInt(0, PI);
        var width = 30 + random(0, 100);
        var height = 30 + random(0, 100);
        var box = boxes.create(x, y, 'box');
        box.width = width;
        box.height = height;
        box.body.kinematic = true;
        //box.body.debug = true;
        box.body.setRectangleFromSprite();
        box.body.rotation = angle;
        box = boxes.create(game.world.width - x, game.world.height-y, 'box');
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

function create() {
	game.time.advancedTiming = true;
	game.input.mouse.capture = true;
	game.physics.startSystem(Phaser.Physics.P2JS);
	game.physics.p2.restitution = 0.8;
	game.stage.backgroundColor = "#EEEEEE";
    game.world.setBounds(0, 0, 1920, 1920);
    //game.physics.p2.setPostBroadphaseCallback(global_overlap_hook, this);

	player1 = new Player('player1_sprite', {
        num_bullets: 30,
        bullet_speed: 800,
        fire_rate: 60,
        max_coll: 3,
        reloading_time: 2000
    }, true, true, {
        x: 100,
        y: 100
    });

    bot1 = new Bot('player1_sprite', {
        num_bullets: 10,
        bullet_speed: 800,
        fire_rate: 60,
        max_coll: 3,
        reloading_time: 2000
    }, false, {
        x: game.world.width,
        y: game.world.height
    }, player1);

    bot2 = new Bot('player1_sprite', {
        num_bullets: 10,
        bullet_speed: 800,
        fire_rate: 60,
        max_coll: 3,
        reloading_time: 2000
    }, false, {
        x: game.world.width,
        y: game.world.height/2
    }, player1);

    //bot1.target_x = 0;
    //bot1.target_y = 0;

    /*player2 = new Player('player1_sprite', {
        num_bullets: 30,
        bullet_speed: 800,
        fire_rate: 60,
        max_coll: 3,
        reloading_time: 2000
    }, true);*/

    //player2.setXY(100, 200);

	cursors = game.input.keyboard.createCursorKeys();
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.A ]);
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.S ]);
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.D ]);
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.W ]);
    game.input.keyboard.addKeyCapture([ Phaser.Keyboard.R ]);

	/*boxes = game.add.physicsGroup(Phaser.Physics.P2JS);
	var b0 = boxes.create(400, 200, 'box');//случайные координаты где-то в середине.
	b0.anchor.setTo(0.5, 0.5);
	b0.body.kinematic = true;
	b0.body.rotation = 0.8243;//случайное, вообще-то число
	var b1 = boxes.create(500, 400, 'box');//случайные координаты где-то в середине.
	b1.anchor.setTo(0.5, 0.5);
	b1.body.kinematic = true;
	b1.body.rotation = 1.8243;//случайное, вообще-то число*/
    generate_field(16, 2, 165);
}

function update() {
	player1.update();
    bot1.update();
    bot2.update();
}

function render() {
    player1.render();
	game.debug.text(dbg, 32, 32);
	game.debug.text(game.time.fps, 2, 14, "#00ff00");
	game.debug.body(player1.player_sprite);
}
