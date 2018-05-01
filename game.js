var game = new Phaser.Game(1000, 600, Phaser.AUTO, "game-field", {preload:preload, create:create, update:update, render:render});

function preload ()
{
	game.load.image('image', 'chelik.png');
	game.load.image('box', 'box0.png');
}

var vel = 200;
var player1;
var cursors;
var boxes;
var b0, b1;

function create ()
{
	game.physics.startSystem(Phaser.Physics.ARCADE);
	game.stage.backgroundColor = "#EEEEEE";
	player1 = game.add.sprite(0, 0, 'image');
	game.physics.arcade.enable(player1);
	
	player1.enableBody = true;
	player1.body.collideWorldBounds = true;
	player1.anchor.setTo(0.5, 0.5);
	cursors = game.input.keyboard.createCursorKeys();
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.A ]);
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.S ]);
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.D ]);
	game.input.keyboard.addKeyCapture([ Phaser.Keyboard.W ]);
	
	boxes = game.add.group();
	boxes.enableBody = true;
	var b0 = boxes.create(400, 200, 'box');//случайные координаты где-то в середине.
	b0.anchor.setTo(0.5, 0.5);
	b0.rotation = 0.8243;//случайное, вообще-то число
	b0.body.immovable = true;
	var b1 = boxes.create(500, 400, 'box');//случайные координаты где-то в середине.
	b1.anchor.setTo(0.5, 0.5);
	b1.rotation = 1.8243;//случайное, вообще-то число
	b1.body.immovable = true;
}

function update() {	
	var hitBox = game.physics.arcade.collide(player1, boxes);

	player1.body.velocity.x = 0;
	player1.body.velocity.y = 0;
	
	if (cursors.left.isDown || game.input.keyboard.isDown(Phaser.Keyboard.A))
    {
        player1.body.velocity.x = -vel;
    }
    else if (cursors.right.isDown || game.input.keyboard.isDown(Phaser.Keyboard.D))
    {
        player1.body.velocity.x = vel;
    }
    if (cursors.up.isDown || game.input.keyboard.isDown(Phaser.Keyboard.W))
    {
        player1.body.velocity.y = -vel;
    }
    else if (cursors.down.isDown || game.input.keyboard.isDown(Phaser.Keyboard.S))
    {
        player1.body.velocity.y = vel;
    }
    player1.rotation = game.physics.arcade.angleToPointer(player1);
    /*if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR))
    {
        fireBullet();
    }*/
}

function render() {
	game.debug.body(player1);
	game.debug.body(boxes);
}
