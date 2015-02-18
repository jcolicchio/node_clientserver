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
var canvas2D;
var ctx;


//var state = GameState.new();
var state;

var Aplayer;// = Player.new(1, "dingus");
var playerInput;

//state.players.push(player);

var update = function() {
	if(Aplayer && state) {
		Aplayer.input = playerInput;
		state.update();
	}

	thingerRotation += Math.PI/40.0;
    if(thingerRotation > Math.PI*2) {
        thingerRotation -= Math.PI*2;
    }
}

var render = function() {
	
	if(Aplayer) {
		GLPlayer.position.x = Aplayer.position.x;
		GLPlayer.position.y = Aplayer.position.y;
	} else {
		console.log(Aplayer);
	}

	//take a list, remove self from it
	var others = [];
	if(state) {
		for(key in state.players) {
			if(!state.players[key].equal(Aplayer)) {
				others.push(state.players[key]);
			}
		}

	}
	drawScene(others);

	//2d debug stuff?
	//ctx.fillStyle = "black";
	//ctx.fillRect(0, 0, 800, 500);

	if(state) {
		//ctx.fillStyle = "red";
		for(key in state.players) {
			var player = state.players[key];
			//ctx.fillRect(player.position.x-10 + 400, player.position.y-10 + 250, 20, 20);
		}
	}
}

$(document).ready(function(){

	canvas = $('#canvas')[0];
	canvas2D = $('#2dcanvas')[0];
	ctx = canvas2D.getContext('2d');

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
		//console.log("got: "+event.data);
		var exc = ServerExchange.import(event.data);
		if(exc.type == ServerExchange.TYPE.GAMESTATE) {
			//console.log("got game state");
			state = exc.payload;
			if(Aplayer) {
				var found = false;
				for(key in state.players) {
					if(state.players[key].equal(Aplayer)) {
						Aplayer = state.players[key];
						found = true;
						break;
					}
				}

				//necessary?
				if(found) {
					Aplayer.input = playerInput;
					console.log("found");
					console.log(player);
				} else {
					Aplayer = null;
					console.log("lost");
					//ask who i am?
				}
			}

		} else if(exc.type == ServerExchange.TYPE.PLAYER) {
			if(exc.key == ServerExchange.KEY.PLAYER.SELF) {
				//console.log("got self player");
				if(state) {
					for(key in state.players) {
						if(state.players[key].equal(exc.payload)) {
							Aplayer = state.players[key];
							break;
						}
					}

					//necessary?
					if(Aplayer) {
						Aplayer.input = playerInput;
					}
				}
			}
		} else if(exc.type == ServerExchange.TYPE.INPUT) {
			//console.log("got response to input");
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
		if(playerInput) {
			connection.send(JSON.stringify(ServerExchange.new(ServerExchange.TYPE.INPUT, ServerExchange.KEY.INPUT.REQUEST, playerInput)));
		}
	}, 1000/20);


    var mouseX = 0.0;
    var mouseY = 0.0;

	//set up webgl stuff!
	initGL(canvas);

	canvas.onmousemove = function (e) {
        var rect = canvas.getBoundingClientRect();
        mouseX = (e.clientX - rect.left) / canvas.width - 0.5;
        mouseY = (e.clientY - rect.top) / canvas.height - 0.5;
        GLPlayer.rotation.horizontal = (mouseX*Math.PI)*2;
        GLPlayer.rotation.vertical = (mouseY*Math.PI);
        playerInput.angle = GLPlayer.rotation.horizontal;
    };


	//function webGLStart() {
        //canvas = document.getElementById("canvas");

        

        //var keys = [];
        //window.onkeydown = function(e) {
            /*if(!keys[70] && e.keyCode == 70) {
                GLPlayer.flashlight = !GLPlayer.flashlight;
                gl.uniform1i(shaderProgram.useFlashlightUniform, flashlight);
            }*/

        //    if((!keys[32] && e.keyCode == 32) && GLPlayer.position.z == 0) {
        //        GLPlayer.velocity.z = 1;
        //    }
        //    keys[e.keyCode] = true;
        //};
        //window.onkeyup = function(e) {
        //    keys[e.keyCode] = false;
        //};

        //var speed = 0.1;
        //var friction = 0.7;
        //setInterval(function(){
        /*    if(keys[87] || keys[38]) { // w
                GLPlayer.velocity.x -= Math.sin(GLPlayer.rotation.horizontal)*speed;
                GLPlayer.velocity.y += Math.cos(GLPlayer.rotation.horizontal)*speed;
            }
            if(keys[83] || keys[40]) { // s
                GLPlayer.velocity.x += Math.sin(GLPlayer.rotation.horizontal)*speed;
                GLPlayer.velocity.y -= Math.cos(GLPlayer.rotation.horizontal)*speed;
            }
            if(keys[65] || keys[37]) { // a
                GLPlayer.velocity.x += Math.cos(GLPlayer.rotation.horizontal)*speed;
                GLPlayer.velocity.y += Math.sin(GLPlayer.rotation.horizontal)*speed;
            }
            if(keys[68] || keys[39]) { // d
                GLPlayer.velocity.x -= Math.cos(GLPlayer.rotation.horizontal)*speed;
                GLPlayer.velocity.y -= Math.sin(GLPlayer.rotation.horizontal)*speed;
            }

            GLPlayer.position.x += GLPlayer.velocity.x;
            GLPlayer.position.y += GLPlayer.velocity.y;


            GLPlayer.velocity.x *= friction;
            GLPlayer.velocity.y *= friction;

            GLPlayer.position.z += GLPlayer.velocity.z;
            if(GLPlayer.position.z > 0) {
                GLPlayer.velocity.z -= 0.1;
            } else {
                GLPlayer.velocity.z = 0;
                GLPlayer.position.z = 0;
            }
		*/
            

            //drawScene();
        //}, 25);

        //initGL(canvas);

        

        
        //gl.disable(gl.DEPTH_TEST);
        //gl.enable(gl.BLEND);
        //gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

        //flashlight = true;
        //gl.uniform1i(shaderProgram.useFlashlightUniform, flashlight);

        //drawScene();


    //}


});
