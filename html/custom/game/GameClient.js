// This is the client, should be pretty much custom code here

var ServerExchange = this['ServerExchange'];
var ServerInfo = this['ServerInfo'];

// data
var me;
var players;

// ui elements
var clientContent;

var canvas;
var ctx;

var initUI = function() {

	

}

var connectUI = function() {
	clientContent = $("<div id='clientcontent'></div>");
	$('body').append(clientContent);


	var disconnectButton = $("<input type='submit' id='disconnect' value='Disconnect' />");
	clientContent.append(disconnectButton).append("<br/>");
	disconnectButton.on("click", function(e) {
		gk.server.close();
	});

	canvas = $("<canvas id='canvas' width=400 height=400></canvas>");
	clientContent.append(canvas);
	ctx = canvas[0].getContext("2d");

	canvas.on('mousemove', function(e) {
		var rect = canvas[0].getBoundingClientRect();
		me.pos.x = e.clientX - rect.left;
		me.pos.y = e.clientY - rect.top;
		gk.server.send("Player", me);
	});

	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, 400, 400);

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

gk = GateKeeperClient();
gk.typeFilter = "Game";

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
	if(key == "Player") {
		// if the server sends a lone player, it's me
		me = payload;
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


