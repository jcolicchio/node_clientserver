var ngb = null;
var connection;
var playerSelf = null;
var connected = false;
var playerList = null;

var Player = this['Player'];
	
if(Player === undefined) {
	Player = require('./Player.js');
}

var canvas;
var ctx;


//var state = GameState.new();
var state;

var player;// = Player.new(1, "dingus");
var playerInput;

//state.players.push(player);

var update = function() {
	if(player && state) {
		player.input = playerInput;
		state.update();
	}
}

var render = function() {
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, 400, 400);

	if(state) {
	ctx.fillStyle = "red";
		for(key in state.players) {
			var player = state.players[key];
			ctx.fillRect(player.position.x-10, player.position.y-10, 20, 20);
		}
	}
}

$(document).ready(function(){

	canvas = $('#canvas')[0];
	ctx = canvas.getContext('2d');

	connection = new WebSocket("ws://"+window.location.hostname+":"+Settings.socketPort);
	connection.onopen = function () {
		console.log("Connection opened");
		//ask who i am?
		/*var exc = ServerExchange.new(ServerExchange.TYPE.PLAYER, ServerExchange.KEY.PLAYER.SELF);
		connection.send(JSON.stringify(exc));
		exc = ServerExchange.new(ServerExchange.TYPE.PLAYER, ServerExchange.KEY.PLAYER.LIST);
		connection.send(JSON.stringify(exc));
		connected = true;
		updateUI();*/
	}
	connection.onclose = function () {
		console.log("Connection closed");
		connected = false;
		//updateUI();
	}
	connection.onerror = function () {
		console.error("Connection error");
	}
	connection.onmessage = function (event) {
		console.log("got: "+event.data);
		var exc = ServerExchange.import(event.data);
		if(exc.type == ServerExchange.TYPE.GAMESTATE) {
			console.log("got game state");
			state = exc.payload;
			if(player) {
				var found = false;
				for(key in state.players) {
					if(state.players[key].equal(player)) {
						player = state.players[key];
						found = true;
						break;
					}
				}

				//necessary?
				if(found) {
					player.input = playerInput;
				} else {
					player = null;
				}
			}

		} else if(exc.type == ServerExchange.TYPE.PLAYER) {
			if(exc.key == ServerExchange.KEY.PLAYER.SELF) {
				console.log("got self player");
				if(state) {
					for(key in state.players) {
						if(state.players[key].equal(exc.payload)) {
							player = state.players[key];
							break;
						}
					}

					//necessary?
					if(player) {
						player.input = playerInput;
					}
				}
			}
		} else if(exc.type == ServerExchange.TYPE.INPUT) {
			console.log("got response to input");
			//we got word from the server that our command went through
			//doesn't matter?
		}
		//updateUI();
	}

	
	playerInput = Input.new();
	$(window).on('keydown', function(e){
		playerInput.keyDown(e.keyCode);
	});
	$(window).on('keyup', function(e){
		playerInput.keyUp(e.keyCode);
	});

	//at 40 fps, update and render
	setInterval(function(){
		update();
		render();
	}, 1000/40);

	//at 10 fps, send your input to the server
	setInterval(function(){
		connection.send(JSON.stringify(ServerExchange.new(ServerExchange.TYPE.INPUT, ServerExchange.KEY.INPUT.REQUEST, playerInput)));
	}, 1000/20);

});
