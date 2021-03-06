// TODO: send results of attack
// TODO: tell each player what color they are at the start

// This is the client, should be pretty much custom code here

var Board = this['Board'];
var Player = this['Player'];

// data
var me;
var players;

// ui elements
var clientContent;

var canvas;
var ctx;

var identityElement;


var connectUI = function() {
	clientContent = $("<div id='clientcontent'></div>");
	$('body').append(clientContent);

	var disconnectButton = $("<input type='submit' id='disconnect' value='Disconnect' />");
	clientContent.append(disconnectButton);
	disconnectButton.on("click", function(e) {
		gk.server.close();
	});

	identityElement = $("<div id='identity'></div>");
	clientContent.append(identityElement);
}

var disconnectUI = function() {
	clientContent.remove();
}

var renderCanvas = function() {
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, 400, 400);
	
	// we're just showing off here
	// I want to demonstrate that each "Player object" we received from the server
	// has an intact ".equal" method, which we use to determine which players *aren't* 'me'
	// instead of drawing our 'me' player based on laggy server input, we'll draw him at mouse coords
	
	ctx.fillStyle = me.color;
	var size = 30;
	ctx.fillRect(me.pos.x-size/2, me.pos.y-size/2, size, size);

	for(key in players) {
		var player = players[key];
		if(!player.equal(me)) {
			ctx.fillStyle = player.color;
			var size = 20;
			ctx.fillRect(player.pos.x-size/2, player.pos.y-size/2, size, size);
		}
	}
}

var updateIdentity = function(player) {
	console.log(JSON.stringify(player)+", "+player.name);
	me = player;
	identityElement.empty().append(player.name+", team: "+colors[player.team]);
}

var source = null;
//var result = null;
var board;
var boardElement;

var colors = ['red', 'yellow', 'pink', 'green', 'blue', 'purple', 'cyan', 'orange'];

var generateBoardUI = function(board) {

	var ret = $("<div class='board'></div>");

	var turnElement = $("<div class='turn'></div>");
	turnElement.append(colors[board.turn]+"'s turn");
	ret.append(turnElement);

	for(var i=0;i<board.height;i++) {
		var row = $("<div class='row'></div>");
		for(var j=0;j<board.width;j++) {
			var cell = $("<div class='cell'></div>");
			var color = colors[board.data[i][j].team];
			cell.addClass(color);
			cell.append(board.data[i][j].count);
			row.append(cell);
			cell.data("team", board.data[i][j].team);
			cell.data("count", board.data[i][j].count);
			cell.data("x", j);
			cell.data("y", i);
			cell.on('click', function() {
				if(board.turn != me.team) {
					return;
				}
				if(source) {
					$('#selected').attr('id', null);
					var dest = {
						x: $(this).data("x"),
						y: $(this).data("y")
					}
					var command = Command.new(source, dest, false);
					source = null;
					
					//var outcome = board.applyCommand(command);
					
					gk.server.send("Command", command);
					
				} else {
					if($(this).data("team") == board.turn) {
						$(this).attr('id', 'selected');
						source = {
							x: $(this).data("x"),
							y: $(this).data("y")
						}
					}
				}
			});
		}
		ret.append(row);
	}
	var endTurn = $("<input type='submit' value='End Turn' />");
	endTurn.on('click', function() {
		//submit to board, and if true, regen board
		var command = Command.new(null, null, true);
		source = null;
		gk.server.send("Command", command);
		//if(board.applyCommand(command)) {
			//ret.remove();
		//	source = null;
			
		//}
	});
	ret.append("<br/>").append(endTurn);
					
	if(board.winner() >= 0) {
		// current player won, no doubt
		boardElement.append("<div class='winner'>"+colors[board.turn]+" wins!</div>");
	}
	return ret;
}

gk = GateKeeperClient();

gk.typeFilter = "Dicewars";

gk.server.onopen = function () {
	connectUI();
	console.log("Connection to server opened");
}
gk.server.onclose = function () {
	console.log("Connection to server closed");
	disconnectUI();
}
gk.server.onerror = function () {
	console.error("Connection error");
}
gk.server.onmessage = function (key, payload) {
	
	if(key == "Player") {
		// if the server sends a lone player, it's me
		updateIdentity(payload);
	} else if(key == "PlayerList") {
		players = payload;

		//renderCanvas();

	} else if(key == "Board") {
		board = payload;

		if(boardElement) {
			boardElement.remove();
		}
		if(board) {
			boardElement = generateBoardUI(board);
			clientContent.append(boardElement);
		} else {
			boardElement = null;
		}

	} else if(key == "Command") {
		// server told us an event happened!
		console.log("current player attacked "+JSON.stringify(payload.dest)+" with "+payload.result.attack+", defender had "+payload.result.defense);
		if(payload.result !== null && payload.result !== undefined) {
			var outcome = payload.result;
			var result = $("<div class='result'></div>");
			result.append( "attack: ("+payload.source.x+","+payload.source.y+"): "+outcome.attack+", defense: ("+payload.dest.x+","+payload.dest.y+"): "+outcome.defense);
			boardElement.append(result);
		}
		
	} else {
		console.log("server sent client unknown key: "+key+" with payload: "+payload);
	}
}

//jquery stuff for setting up the page, most of this code is
$(document).ready(function(){
	gk.connect();
});


