// HTTP Portion
var http = require('http');
var fs = require('fs'); // Using the filesystem module
var httpServer = http.createServer(requestHandler);
var url = require('url');

function requestHandler(req, res) {

	var parsedUrl = url.parse(req.url);
	console.log("The Request is: " + parsedUrl.pathname);

	// Read in the file they requested

	fs.readFile(__dirname + parsedUrl.pathname,
		// Callback function for reading
		function (err, data) {
			// if there is an error
			if (err) {
				res.writeHead(500);
				return res.end('Error loading ' + parsedUrl.pathname);
			}
			// Otherwise, send the data, the contents of the file
			res.writeHead(200);
			res.end(data);
  		}
  	);
}

// Call the createServer method, passing in an anonymous callback function that will be called when a request is made
var httpServer = http.createServer(requestHandler);

// Tell that server to listen on port 8080
httpServer.listen(8081);

console.log('Server listening on port 8081');

// WebSocket Portion
// WebSockets work with the HTTP server
var io = require('socket.io').listen(httpServer);

var playerSockets = [];

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection',
	// We are given a websocket object in our function
	function (socket) {
		console.log("We have a new client: " + socket.id);
		playerSockets.push(socket.id);

		// When this user "send" from clientside javascript, we get a "message"
		// client side: socket.send("the message");  or socket.emit('message', "the message");
		socket.on('message',
			// Run this function when a message is sent
			function (data) {
				console.log("message: " + data);

				// Call "broadcast" to send it to all clients (except sender), this is equal to
				// socket.broadcast.emit('message', data);
				//socket.broadcast.send(data);

				// To all clients, on io.sockets instead
				io.sockets.emit('message', data);
			});


		socket.on ('moveUp', function (data) {
			for (let i = 0; i < 4; i++) {
				if (playerBats[i].role == playerSockets.indexOf(socket.id)) {
					cgBatPos(i,-1);
				}
			}
			console.log('moveUp:'+ data);
		});

		socket.on ('moveDown', function (data) {
			for (let i = 0; i < 4; i++) {
				if (playerBats[i].role == playerSockets.indexOf(socket.id)) {
					cgBatPos(i,1);
				}
			}
			console.log('moveDown:'+ data);
		});

		socket.on ('restart', function () {
			if (playerSockets.length == 4) {
				if ((ball.vx == 0) && (ball.vy == 0)) {
					setUp();
				}
			} else {
				io.sockets.emit('playerNumAlert');
			}
		});

		socket.on('disconnect', function() {
			console.log("Client has disconnected: " + socket.id);
			for( let i = 0; i < playerSockets.length; i++){
   			if ( playerSockets[i] === socket.id) {
     			playerSockets.splice(i, 1);
   			}
			}
		});
		setInterval(update, 1000/30, socket);
	});

var batLength = 80;
var tableWidth = 800;
var tableHeight = 500;

// an array to hold playerBat coordinates.
var playerBats = [];
for (let i = 0; i<4; i++) {
		let playerBat = new Object();
		playerBat.edge = Math.floor(i/2);
		if (i==0 || i ==3) {
			playerBat.x = 100;
		} else {
			playerBat.x = 350;
		}
		playerBat.role = i;
		playerBats.push(playerBat);
	}

var ball = {
		x:0,
		y:0,
		vx:0,
		vy:0
	}

function setUp() {
	ball.vx = Math.random()*10;
	ball.vy = Math.random()*10;
	ball.x = 0;
	ball.y = 0;

	playerBats[0].x = 100;
	playerBats[1].x = 350;
	playerBats[2].x = 350;
	playerBats[3].x = 100;
}

// //update data structure: {myRole:n, batPos:[{edge:n, x:x}, {edge:n, x:x}, {edge:n, x:x}, {edge:n, x:x}], ballPos:{x:x, y:y}}
function update(socket){
	updateBallPos();

	let data = new Object();
	data.myRole = false;
	data.batPos = [{edge:0, x:0}, {edge:0, x:0}, {edge:0, x:0}, {edge:0, x:0}];
	data.ballPos = {x:0, y:0};

	for (let i = 0; i < 4; i++) {
		if (playerBats[i].role == playerSockets.indexOf(socket.id)) {
			data.myRole = i;
		}
		for (let i = 0; i < 4; i++) {
			data.batPos[i].edge = playerBats[i].edge;
			data.batPos[i].x = playerBats[i].x;
		}
		data.ballPos.x = ball.x;
		data.ballPos.y = ball.y;
	}
	socket.emit('update', data);
}

setInterval(rotateRole, 1000/0.1);

function rotateRole(){
	for (let i = 0; i < 4; i++) {
		playerBats[i].role ++;
		if (playerBats[i].role > 3) {
			playerBats[i].role = 0;
		}
	}
	console.log('rotate!');
}




function updateBallPos(){
	ball.x += ball.vx;
	ball.y += ball.vy;

// when you lose the game
	if ((ball.x <= 0) || (ball.x >= tableWidth-10)) {
		ball.vx = 0;
		ball.vy = 0;
	} else {
		//judge pat intersection
		if (judgeBatIntersection() == true) {
			ball.vx *= -1;
		}
	}
	if ((ball.y <= 0) || (ball.y >= tableHeight-10)) {
		ball.vy *= -1;
	}
}

function judgeBatIntersection(){
	let judgement = false;
	for (let i = 0; i < 4; i++) {
		if (playerBats[i].edge == 0) {
			if ((ball.x <= 10) &&
			(ball.y >= playerBats[i].x) &&
			(ball.y <= playerBats[i].x + batLength)) {
				judgement = true;
				ball.vy += (playerBats[i].x-ball.y)*0.1; //make it a bit more interesting
			}
		} else if (playerBats[i].edge == 1) {
			if ((ball.x >= tableWidth-20) &&
			(ball.y >= playerBats[i].x) &&
			(ball.y <= playerBats[i].x + batLength)) {
				judgement = true;
				ball.vy += (playerBats[i].x-ball.y)*0.1; // make it a bit more interesting
			}
		}
	}
	return judgement;
}


function cgBatPos(batNum, direction) {
	playerBats[batNum].x += direction*20;
	if (batNum == 0 || batNum == 3) {
		if (playerBats[batNum].x <= 0) {
			playerBats[batNum].x = 0;
		} else if (playerBats[batNum].x >= 250-batLength) {
			playerBats[batNum].x = 250 -batLength;
		}
	} else {
		if (playerBats[batNum].x <= 250) {
			playerBats[batNum].x = 250;
		} else if (playerBats[batNum].x >= 500-batLength) {
			playerBats[batNum].x = 500 -batLength;
		}
	}
}
