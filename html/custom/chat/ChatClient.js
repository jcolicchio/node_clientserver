// This is the client, should be pretty much custom code here

// data
var me;

// ui elements
var clientContent;
var messages;

// actual game UI

var connectUI = function() {
	clientContent = $("<div id='clientcontent'></div>");
	$('body').append(clientContent);

	var disconnectButton = $("<input type='submit' id='disconnect' value='Disconnect' />");
	clientContent.append(disconnectButton);
	disconnectButton.on("click", function(e) {
		gk.server.close();
	});

	messages = $("<div id='chat'></div>");
	clientContent.append(messages).append("<br/>");

	var textBox = $("<input type='text' id='message' />");
	var sendButton = $("<input type='submit' id='send' value='Send' />");
	clientContent.append(textBox).append(sendButton).append("<br/>");

	sendButton.on("click", function(e) {
		gk.server.send("message", textBox.val());
		textBox.val("");
	});

	textBox.on("keydown", function(e) {
		if(e.keyCode == 13) {
			sendButton.click();
		}
	});

}

var disconnectUI = function() {
	clientContent.remove();
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

// server connection and GK ui

var gk = GateKeeperClient();

gk.typeFilter = "Chat";

gk.server.onopen = function() {
	connectUI();
	console.log("Connection to server opened");
}

gk.server.onclose = function() {
	disconnectUI();
	console.log("Connection to server closed!");
}

gk.server.onmessage = function(key, payload) {

	if(key == "message") {
		newMessage(payload);
	} else if(key == "Player") {
		// if the server sends a lone player, it's me
		me = payload;
	} else if(key == "PlayerList") {
		players = payload;
	} else {
		console.log("server sent client unknown key: "+key+" with payload: "+payload);
	}
}

gk.server.onerror = function() {
	console.error("Connection error");
}

$(document).ready(function(){
	gk.connect();
});
