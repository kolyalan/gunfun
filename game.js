var game = new Phaser.Game(1000, 600, Phaser.AUTO, "game-field", {preload:preload, create:create, update:update, render:render});

function preload ()
{
	game.load.spritesheet('image', 'chelik.png', 174, 100);
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


	player1 = game.add.sprite(0, 0, 'image');
	game.physics.p2.enable(player1, true);//true - debug
	player1.frame = 1;
	player1.animations.add('go', [1, 0, 1, 2], 7, true);
	player1.enableBody = true;
	player1.body.collideWorldBounds = true;
	player1.anchor.setTo(0.45, 0.54);
	player1.body.setCircle(65);


	// https://phaser.io/examples/v2/weapon/bullet-angle-variance
	//  Creates 30 bullets, using the 'bullet' graphic
	weapon = game.add.weapon(30, 'bullet');
    //  The bullet will be automatically killed when it leaves the world bounds
    weapon.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;
    //  Because our bullet is drawn facing up, we need to offset its rotation:
    //weapon.bulletAngleOffset = -90;
    //  The speed at which the bullet is fired
    weapon.bulletSpeed = 800;
    //  Speed-up the rate of fire, allowing them to shoot 1 bullet every 60ms
    weapon.fireRate = 60;
    //  Add a variance to the bullet angle by +- this value
    weapon.bulletAngleVariance = 5;
	weapon.trackSprite(player1, 103, 0, true);
	//weapon.bulletCollideWorldBounds = true;
	//weapon.bulletEnableBody = true;


	cursors = game.input.keyboard.createCursorKeys();
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.A ]);
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.S ]);
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.D ]);
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.W ]);

	boxes = game.add.physicsGroup(Phaser.Physics.P2JS);
	var b0 = boxes.create(400, 200, 'box');//случайные координаты где-то в середине.
	b0.anchor.setTo(0.5, 0.5);
	b0.body.kinematic = true;
	b0.body.rotation = 0.8243;//случайное, вообще-то число
	var b1 = boxes.create(500, 400, 'box');//случайные координаты где-то в середине.
	b1.anchor.setTo(0.5, 0.5);
	b1.body.kinematic = true;
	b1.body.rotation = 1.8243;//случайное, вообще-то число
	
	/*создание одной пули*/
	bullet = game.add.sprite(0, 0, 'bullet');
	game.physics.p2.enable(bullet, false);
	bullet.body.dynamic = true;
	bullet.anchor.setTo(0.5, 0.5);
	bullet.body.damping = 0.01; //part of velocity losed per second [0..1];
	bullet.body.setCircle(7);
	bullet.body.fixedRotation = false;
	bullet.kill();
	bullet.body.onBeginContact.add(bulletHit, this, 0, bullet);
	bullet.countHit = 0;//еще не ударялась.
	/*конец создания одной пули */
}

function bulletHit(body, bodyB, shapeA, shapeB, equation, bull) { // обработчик касания пули с объектом body
	bullet.countHit += 1;
	if(bullet.countHit > bullet_live) {
		bullet.kill();
		return;
	}
	if (body) {//hit
		dbg = "body:" + body.sprite.key + " bodyB: " + bodyB.sprite;
		
	} else { //bullet hit the wall
		dbg = "bullet hit the wall";
	}
	
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
    
	/*update для одной пули. Вроде бы нужно вызывать для каждой*/
	if (bullet.alive) {
		bullet.body.rotation = Math.atan2(bullet.body.velocity.y, bullet.body.velocity.x);
	}
	/*конец update для одной пули*/
	
	//weapon.fireAngle = Phaser.Math.radToDeg(game.physics.arcade.angleToPointer(player1));
	/*выстрел одной пули*/
    if(game.input.activePointer.leftButton.isDown) {
		bullet.countHit = 0;
        bullet.body.rotation = player1.body.rotation;
		bullet.body.x = player1.body.x + 93*Math.cos(bullet.body.rotation);
		bullet.body.y = player1.body.y + 93*Math.sin(bullet.body.rotation);
        bullet.body.moveRight(200*Math.cos(bullet.body.rotation));
        bullet.body.moveDown(200*Math.sin(bullet.body.rotation));
		bullet.revive();
        //weapon.fire();
    }
    /*конец выстрела пули*/
}

function render() {
	game.debug.text(dbg, 32, 32);
	game.debug.text(game.time.fps, 2, 14, "#00ff00");
	game.debug.body(player1);
}
