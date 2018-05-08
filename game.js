var game = new Phaser.Game(1000, 600, Phaser.AUTO, "game-field", {preload:preload, create:create, update:update, render:render});

function preload ()
{
	game.load.spritesheet('image', 'chelik.png', 100, 174);
	game.load.image('box', 'box0.png');
}

var vel = 300;
var player1;
var cursors;
var boxes;
var b0, b1;

function create ()
{
	game.physics.startSystem(Phaser.Physics.P2JS);
	game.physics.p2.defaultRestitution = 1;
	game.stage.backgroundColor = "#EEEEEE";
	player1 = game.add.sprite(0, 0, 'image');
	game.physics.p2.enable(player1, true);
	player1.frame = 1;
	player1.animations.add('go', [1, 0, 1, 2], 7, true);
	
	
	player1.enableBody = true;
	player1.body.collideWorldBounds = true;
	player1.anchor.setTo(0.5, 0.5);
	cursors = game.input.keyboard.createCursorKeys();
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.A ]);
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.S ]);
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.D ]);
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.W ]);
	
	boxes = game.add.physicsGroup(Phaser.Physics.P2JS);
	var b0 = boxes.create(400, 200, 'box');//случайные координаты где-то в середине.
	b0.anchor.setTo(0.5, 0.5);
	//b0.body.static = true;
	b0.body.rotation = 0.8243;//случайное, вообще-то число
	var b1 = boxes.create(500, 400, 'box');//случайные координаты где-то в середине.
	b1.anchor.setTo(0.5, 0.5);
	//b1.body.static = true;
	b1.body.rotation = 1.8243;//случайное, вообще-то число
	b1.body.immovable = true;
}

function update() {	
	var hitBox = game.physics.arcade.collide(player1, boxes);

	player1.body.setZeroVelocity();
	if (cursors.left.isDown || game.input.keyboard.isDown(Phaser.Keyboard.A))
    {
		player1.animations.play('go');
        player1.body.moveLeft(vel);
    }
    else if (cursors.right.isDown || game.input.keyboard.isDown(Phaser.Keyboard.D))
    {
		player1.animations.play('go');
        player1.body.moveRight(vel);
    }
    if (cursors.up.isDown || game.input.keyboard.isDown(Phaser.Keyboard.W))
    {
		player1.animations.play('go');
		player1.body.moveUp(vel);
    }
    else if (cursors.down.isDown || game.input.keyboard.isDown(Phaser.Keyboard.S))
    {
		player1.animations.play('go');
		player1.body.moveDown(vel);
    }
    if(player1.body.velocity.x == 0 && player1.body.velocity.y == 0) {
		player1.animations.stop();
        player1.frame = 1;
	}
    player1.body.rotation = game.physics.arcade.angleToPointer(player1)+3.1414926535/2	;
    /*if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR))
    {
        fireBullet();
    }*/
}

function render() {
	game.debug.body(player1);
	game.debug.body(boxes);
}
