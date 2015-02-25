// This is the client, should be pretty much custom code here

var ServerExchange = this['ServerExchange'];
var ServerInfo = this['ServerInfo'];

var server;
var me;
var players;

var clientContent;
var serverStatus;
var messages;
var canvas;
var ctx;

var initUI = function() {
	clientContent = $("<div id='clientcontent'></div>");
	$('body').append(clientContent);

	serverStatus = $("<div id='serverstatus'></div>");
	clientContent.append(serverStatus).append("<br/>");

	setStatus("Connecting...");
}

var connectUI = function() {
	setStatus("Connected! ");

	var disconnectButton = $("<input type='submit' id='disconnect' value='Disconnect' />");
	serverStatus.append(disconnectButton);
	disconnectButton.on("click", function(e) {
		server.close();
	});

	messages = $("<div id='chat'></div>");
	clientContent.append(messages).append("<br/>");

	var textBox = $("<input type='text' id='message' />");
	var sendButton = $("<input type='submit' id='send' value='Send' />");
	clientContent.append(textBox).append(sendButton).append("<br/>");

	sendButton.on("click", function(e) {
		server.send(JSON.stringify(ServerExchange.new("message", textBox.val())));
		textBox.val("");
	});

	textBox.on("keydown", function(e) {
		if(e.keyCode == 13) {
			sendButton.click();
		}
	});

	canvas = $("<canvas id='canvas' width=400 height=400></canvas>");
	clientContent.append(canvas);
	ctx = canvas[0].getContext("2d");

	canvas.on('mousemove', function(e) {
		var rect = canvas[0].getBoundingClientRect();
		me.pos.x = e.clientX - rect.left;
		me.pos.y = e.clientY - rect.top;
		server.send(JSON.stringify(ServerExchange.new("Player", me)));
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
			server.send(JSON.stringify(ServerExchange.new("Player", me)));
		}
	});
}

var disconnectUI = function() {
	clientContent.remove();
}

var setStatus = function(status) {
	serverStatus.empty().append(status);
}

var newMessage = function(message) {
	// check to see if it's scrolled to bottom
	var elem = messages[0];
	var scrollToBottom = false;
	if(elem.scrollTop + messages.height() == elem.scrollHeight) {
		scrollToBottom = true;
	}
	messages.append(message).append("<br/>");
	if(scrollToBottom) {
		elem.scrollTop = elem.scrollHeight;
	} else {
		elem.scrollTop = elem.scrollTop+1;
		elem.scrollTop = elem.scrollTop-1;
	}
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

//jquery stuff for setting up the page, most of this code is
$(document).ready(function(){

	// This is a connection to the GateKeeper
	// The argument is a callback for connecting to our own server, given one of our serverinfo objects
	connectToGateKeeper(connectToServer);

});

var server;

// custom stuff specific to our game server itself
// note: we'll receive a ServerInfo object from GateKeeperClient.js
var connectToServer = function(serverInfo) {

	initUI();

	server = new WebSocket("ws://"+serverInfo.serverString());
	server.onopen = function () {
		disconnectFromGateKeeper();
		console.log("Connection to server opened");

		
		server.connected = true;
	}
	server.onclose = function () {
		console.log("Connection to server closed");
		server.connected = false;

		disconnectUI();

		// we disconnected from game, connect to GK again!
		connectToGateKeeper(connectToServer);
	}
	server.onerror = function () {
		console.error("Connection error");
	}
	server.onmessage = function (event) {
		var exc = ServerExchange.import(event.data);

		if(exc.key == "joined") {
			console.log("joined!");
			connectUI();
		} else if(exc.key == "message") {
			newMessage(exc.payload);
		} else if(exc.key == "password") {
			// the server has a password
			var pw = prompt("Password?");
			server.send(JSON.stringify(ServerExchange.new("password", pw)));
		} else if(exc.key == "Player") {
			// if the server sends a lone player, it's me
			me = exc.payload;
			$("input[name='color'][value='"+exc.payload.color+"']").click();
		} else if(exc.key == "PlayerList") {
			console.log(exc.payload);
			players = exc.payload;

			renderCanvas();

		} else {
			console.log("server sent client unknown key: "+exc.key+" with payload: "+exc.payload);
		}
	}
}


