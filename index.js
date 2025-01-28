const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
let gameOver = false;
let winCondition = false;
const keys = {
	a: { pressed: false },
	d: { pressed: false },
};
const missiles = [];
const aliens = [];
const alienMissiles = [];
const shields = [];
let direction = "right";

//Draw game screen
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;

//Game Settings
alienSpacing = 30;
alienSize = 20;
alienGrid = canvas.width / (alienSize + alienSpacing);
alienTroops = alienGrid / 2;
shieldSize = 100;
shieldSpacing = 100;
shieldGrid = canvas.width / (shieldSize + shieldSpacing);
shieldNumber = shieldGrid / 1.25;
shieldsWidth = shieldNumber * shieldSize + (shieldNumber - 1) * shieldSpacing;
shieldsStart = (canvas.width - shieldsWidth) / 2;
playerSpeed = 5;
playerColor = "#0000ff";
missileSpeed = 5;
alienColor = "#E10600";
alienSpeed = 150;
alienFireRate = 300;
alienMissileSpeed = 10;

//Game objects
class Player {
	constructor({ position, velocity, radius }) {
		this.position = position;
		this.velocity = velocity;
		this.radius = 20;
	}

	draw() {
		ctx.save();
		ctx.beginPath();
		ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
		ctx.closePath();
		ctx.fillStyle = playerColor;
		ctx.fill();
	}

	update() {
		this.draw();
		this.position.x += this.velocity.x;
	}
}

class Missile {
	constructor({ position, velocity, radius }) {
		this.position = position;
		this.velocity = velocity;
		this.radius = 5;
	}

	draw() {
		ctx.beginPath();
		ctx.arc(
			this.position.x,
			this.position.y,
			this.radius,
			0,
			Math.PI * 2,
			false
		);
		ctx.closePath();
		ctx.fillStyle = playerColor;
		ctx.fill();
	}

	update() {
		this.draw();
		this.position.x += this.velocity.x;
		this.position.y += this.velocity.y;
	}
}

class Alien {
	constructor({ position, velocity, radius }) {
		this.position = position;
		this.velocity = velocity;
		this.radius = alienSize;
	}

	draw() {
		ctx.beginPath();
		ctx.arc(
			this.position.x,
			this.position.y,
			this.radius,
			0,
			Math.PI * 2,
			false
		);
		ctx.closePath();
		ctx.fillStyle = alienColor;
		ctx.fill();
	}

	update() {
		this.draw();
		this.position.x += this.velocity.x;
		this.position.y += this.velocity.y;
	}
}

class AlienMissile {
	constructor({ position, velocity }) {
		this.position = position;
		this.velocity = velocity;
		this.radius = 5;
	}

	draw() {
		ctx.beginPath();
		ctx.arc(
			this.position.x,
			this.position.y,
			this.radius,
			0,
			Math.PI * 2,
			false
		);
		ctx.closePath();
		ctx.fillStyle = alienColor;
		ctx.fill();
	}

	update() {
		this.draw();
		this.position.x += this.velocity.x;
		this.position.y += this.velocity.y;
	}
}

class Shield {
	constructor({ position, length }) {
		this.position = position;
		this.width = shieldSize;
		this.height = 20;
	}

	draw() {
		ctx.beginPath();
		ctx.rect(this.position.x, this.position.y, this.width, this.height);
		ctx.closePath();
		ctx.fillStyle = "white";
		ctx.fill();
	}

	update() {
		this.draw();
		this.length.x = this.length.x;
	}
}

function playerLogic() {
	player.update();

	if (keys.a.pressed) {
		player.velocity.x = -playerSpeed;
	} else if (keys.d.pressed) {
		player.velocity.x = playerSpeed;
	} else {
		player.velocity.x = 0;
	}

	//Edge detection
	if (player.position.x - player.radius < 0) {
		player.position.x = player.radius;
	}
	if (player.position.x > canvas.width - player.radius) {
		player.position.x = canvas.width - player.radius;
	}
}

function missileLogic(missiles) {
	missiles.forEach((missile) => {
		missile.update();

		//Garbage collection
		if (missile.position.y < 0 || missile.position.y > canvas.heihgt) {
			missiles.splice(missiles.indexOf(missile), 1);
		}
	});
}

function alienMovement() {
	const rightAlien = aliens[aliens.length - 1];
	const leftAlien = aliens[0];

	function moveDown() {
		aliens.forEach((alien) => {
			alien.position.y += alienSize + alienSpacing;

			if (alien.position.y > canvas.height - 100) {
				gameOver = true;
			}
		});
	}

	if (rightAlien.position.x + rightAlien.radius > canvas.width) {
		direction = "left";
		moveDown();
	} else if (leftAlien.position.x - leftAlien.radius < 0) {
		direction = "right";
		moveDown();
	}

	if (direction === "right") {
		aliens.forEach((alien) => {
			alien.position.x += 10;
		});
	} else {
		aliens.forEach((alien) => {
			alien.position.x -= 10;
		});
	}
}

function alienFireMissiles() {
	const randomAlien = aliens[Math.floor(Math.random() * aliens.length)];

	alienMissiles.push(
		new AlienMissile({
			position: {
				x: randomAlien.position.x,
				y: randomAlien.position.y + alienSize,
			},
			velocity: { x: 0, y: alienMissileSpeed },
		})
	);
}

function collisions() {
	function sphereDetection(sphere1, sphere2) {
		return (
			Math.hypot(
				sphere1.position.x - sphere2.position.x,
				sphere1.position.y - sphere2.position.y
			) <
			sphere1.radius + sphere2.radius
		);
	}

	function sphereRectangleDetection(sphere, rect) {
		let closestX = Math.max(
			rect.position.x,
			Math.min(sphere.position.x, rect.position.x + rect.width)
		);
		let closestY = Math.max(
			rect.position.y,
			Math.min(sphere.position.y, rect.position.y + rect.height)
		);

		let distanceX = sphere.position.x - closestX;
		let distanceY = sphere.position.y - closestY;

		return (
			distanceX * distanceX + distanceY * distanceY <
			sphere.radius * sphere.radius
		);
	}

	aliens.forEach((alien) => {
		missiles.forEach((missile) => {
			if (sphereDetection(alien, missile)) {
				aliens.splice(aliens.indexOf(alien), 1);
				missiles.splice(missiles.indexOf(missile), 1);
			}
		});
	});

	shields.forEach((shield) => {
		alienMissiles.forEach((alienMissile) => {
			if (sphereRectangleDetection(alienMissile, shield)) {
				alienMissiles.splice(alienMissiles.indexOf(alienMissile), 1);
				shield.width -= 10;
			}
		});

		missiles.forEach((missile) => {
			if (sphereRectangleDetection(missile, shield)) {
				missiles.splice(missiles.indexOf(missile), 1);
			}
		});
	});

	alienMissiles.forEach((alienMissile) => {
		if (sphereDetection(alienMissile, player)) {
			gameOver = true;
		}
	});

	if (aliens.length === 0) {
		winCondition = true;
		gameOver = true;
	}
}

//Inputs
window.addEventListener("keydown", (e) => {
	switch (e.code) {
		case "KeyA":
			keys.a.pressed = true;
			break;
		case "KeyD":
			keys.d.pressed = true;
			break;
		case "Space":
			missiles.push(
				new Missile({
					position: {
						x: player.position.x,
						y: player.position.y - player.radius,
					},
					velocity: {
						x: 0,
						y: -missileSpeed,
					},
				})
			);
			break;
		case "Enter":
			if (gameOver) {
				window.location.reload();
			}
			break;
	}
});

window.addEventListener("keyup", (e) => {
	switch (e.key) {
		case "a":
			keys.a.pressed = false;
			break;
		case "d":
			keys.d.pressed = false;
			break;
	}
});

//Run game loop
function animate() {
	const animationId = window.requestAnimationFrame(animate);
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	playerLogic();
	missileLogic(missiles);
	missileLogic(alienMissiles);
	aliens.forEach((alien) => {
		alien.update();
	});
	shields.forEach((shield) => {
		shield.draw();
	});
	collisions();

	if (gameOver) {
		window.cancelAnimationFrame(animationId);
		clearInterval(alienMovementInt);
		clearInterval(alienFireInt);

		//Game over screen
		ctx.fillStyle = "white";
		ctx.font = "48px Arial";
		ctx.textAlign = "center";
		if (winCondition) {
			ctx.fillText("Victory!", canvas.width / 2, canvas.height / 2);
		} else {
			ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
		}
		ctx.font = "24px Arial";
		ctx.fillText(
			"Press ENTER to restart",
			canvas.width / 2,
			canvas.height / 2 + 50
		);
		return;
	}
}

//Go!
for (let i = 0; i < alienTroops; i++) {
	//Generate aliens
	aliens.push(
		new Alien({
			position: { x: (alienSize * 2 + alienSpacing) * (i + 1), y: 50 },
			velocity: { x: 0, y: 0 },
		})
	);
}

for (let i = 0; i < shieldNumber; i++) {
	//Generate shields
	shields.push(
		new Shield({
			position: {
				x: shieldsStart + i * (shieldSize + shieldSpacing),
				y: canvas.height - 100,
			},
		})
	);
}

//Move aliens and fire lasers
const alienMovementInt = setInterval(alienMovement, alienSpeed);
const alienFireInt = setInterval(alienFireMissiles, alienFireRate);

//Generate player
const player = new Player({
	position: { x: canvas.width / 2, y: canvas.height - 50 },
	velocity: { x: 0 },
});

animate();
