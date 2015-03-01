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

var boardWidth = 300;
var boardHeight = 300;

var connectUI = function() {
	clientContent = $("<div id='clientcontent'></div>");
	$('body').append(clientContent);

	var turnElement = $("<div class='turn'></div>");
	turnElement.append("player's turn"); //TODO: make this work
	clientContent.append(turnElement);

	var disconnectButton = $("<input type='submit' id='disconnect' value='Disconnect' />");
	clientContent.append(disconnectButton).append("<br/>");
	disconnectButton.on("click", function(e) {
		gk.server.close();
	});
	
	canvas = $("<canvas id='canvas'></canvas>");
	canvas.attr("width", boardWidth.toString());
	canvas.attr("height", boardHeight.toString());
	clientContent.append(canvas);
	ctx = canvas[0].getContext("2d");

	$("#canvas").click(function(e){
		var x = Math.floor(e.pageX-$("#canvas").offset().left);
		var y = Math.floor(e.pageY-$("#canvas").offset().top);
		console.log("canvas clicked "+x+", "+y);
		gk.server.send("coord", {x:x,y:y});
	});
	/*	
	var canvasObj = document.getElementById("canvas");
	canvasObj.addEventListener("click", function(evt){
		var rect = canvasObj.getBoundingClientRect();
		var mousePosX = evt.clientX - rect.left;
		var mousePosY = evt.clientY - rect.top;
		console.log("canvas clicked at "+ mousePosX + ", " + mousePosY);
	}, false);
	*/

	identityElement = $("<div id='identity'></div>");
	clientContent.append(identityElement);

	var colors = $("<form action=''></form>");
	clientContent.append(colors);

	var redColor = $("<input type='radio' name='color' value='red'>Red</input>");
	var greenColor = $("<input type='radio' name='color' value='green'>Green</input>");
	var blueColor = $("<input type='radio' name='color' value='blue'>Blue</input>");
	colors.append(redColor).append(greenColor).append(blueColor);

	$("input[name='color']").change(function() {
		if(me.color != this.value) {
			me.color = this.value;
			// send to server!
			gk.server.send("Player", me);
		}
	});
}

var disconnectUI = function() {
	clientContent.remove();
}

var renderCanvas = function() {
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, boardWidth, boardHeight);

	ctx.fillStyle = "black";	
	ctx.beginPath();
	ctx.moveTo(0, boardHeight/3);
	ctx.lineTo(boardWidth, boardHeight/3);
	ctx.stroke();
	ctx.moveTo(0, boardHeight*2/3);
	ctx.lineTo(boardWidth, boardHeight*2/3);
	ctx.stroke();
	ctx.moveTo(boardWidth/3, 0);
	ctx.lineTo(boardWidth/3, boardHeight);
	ctx.stroke();
	ctx.moveTo(boardWidth*2/3, 0);
	ctx.lineTo(boardWidth*2/3, boardHeight);
	ctx.stroke();

}

var updateIdentity = function(player) {
	console.log(JSON.stringify(player)+", "+player.name);
	me = player;
	identityElement.empty().append(player.name);
}

var source = null;
var board = [[0,0,0],[0,0,0],[0,0,0]];
var boardElement;

var generateBoardUI = function(board) {
    if (board != undefined && board != null) {
        for (var i = 0; i<3; i++){
            for (var j = 0; j<3; j++){
                if (board[i][j] === 2){
                ctx.fillStyle = "red";
                ctx.fillRect(i*100, j*100, 50, 50);
                } else if (board[i][j] === 1){
                ctx.fillStyle = "blue";
                ctx.fillRect(i*100, j*100, 50, 50);
                }
            }
        }
    }

}

// gatekeeper and server connection

gk = GateKeeperClient();

gk.typeFilter = "TicTacToe";

gk.server.onopen = function() {
	console.log("Connection to server opened");
	connectUI();
}

gk.server.onclose = function() {
	console.log("Connection to server closed");
	disconnectUI();
}

gk.server.onerror = function() {
	console.error("Connection error");
}

gk.server.onmessage = function(key, payload) {
	if(key == "update") {
		console.log("print out what the server says: "+payload.result);
	}

	if(key == "Player") {
		// if the server sends a lone player, it's me
		updateIdentity(payload);
		$("input[name='color'][value='"+payload.color+"']").click();
	} else if(key == "PlayerList") {
		players = payload;
		renderCanvas();
	} else {
		console.log("server sent client unknown key: "+key+" with payload: "+payload);
	}
}

//jquery stuff for setting up the page, most of this code is
$(document).ready(function(){
	gk.connect();
});


