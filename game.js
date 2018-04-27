var config = {
	type: Phaser.AUTO,
	canvas: document.getElementById("game-field"),
	width: 800,
	height: 600,
	backgroundColor: {
		r:255,
		g:255,
		b:255
	},
	physics: {
		default: 'arcade',
	},
	scene: {
		preload: preload,
		create: create
	}
};

var game = new Phaser.Game(config);

function preload ()
{
	this.load.setBaseURL('http://labs.phaser.io');

	this.load.image('sky', 'assets/skies/space3.png');
	this.load.image('logo', 'assets/sprites/phaser3-logo.png');
	this.load.image('red', 'assets/particles/red.png');
}

function create ()
{
	console.log(this);
	//this.add.image(400, 300, 'sky');

	var logo = this.physics.add.image(400, 100, 'logo');

	logo.setVelocity(200, 200);
	logo.setBounce(1, 1);
	logo.setCollideWorldBounds(true);
}
