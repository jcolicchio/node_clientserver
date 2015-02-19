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
//var prevState;

var Aplayer;// = Player.new(1, "dingus");
var playerInput;

//state.players.push(player);

var fakeClient = false;

var localUpdateRate = 40;
var clientInputTransmissionRate = 30;

var update = function() {
	if(Aplayer && state) {
		Aplayer.input = playerInput;
		state.update();
	}

	thingerRotation += Math.PI/40.0;
    if(thingerRotation > Math.PI*2) {
        thingerRotation -= Math.PI*2;
    }

    if(fakeClient) {
    	playerInput.angle += Math.PI/64;
    	playerInput.keys.up = true;
    }
}

var render = function() {
	

	if(Aplayer) {
		GLPlayer.position.x = Aplayer.position.x;
		GLPlayer.position.y = Aplayer.position.y;
		GLPlayer.position.z = Aplayer.position.z;

		//calculate distance between camera's position and player's
		//if it's > 3, move cam to be on that imaginary player bubble
		//then tilt camera down to face player
		var playerHeight = 4;
		var camOverShoulder = 2;
		var delta = {
			x: GLPlayer.camera.position.x - GLPlayer.position.x,
			y: GLPlayer.camera.position.y - GLPlayer.position.y, 
			// the focus point is the snowman's head area, not his feet
			z: GLPlayer.camera.position.z - (GLPlayer.position.z + camOverShoulder),
		}
		//maybe instead, we fix Z to playerHeight + some
		var dist = Math.sqrt(delta.x*delta.x + delta.y*delta.y + delta.z*delta.z);
		var maxDist = 30;
		var minDist = 10;
		var positionEasing = 1;
		var angleEasing = 1;
		var factor = 1;
		if(dist > maxDist) {
			//factor = maxDist/dist;
			/*GLPlayer.camera.position.x = GLPlayer.position.x;
			GLPlayer.camera.position.y = GLPlayer.position.y;
			GLPlayer.camera.position.z = GLPlayer.position.z + 4;*/

			factor = maxDist/dist;
			delta.x *= factor;
			delta.y *= factor;
			//delta.z = 0;


			//GLPlayer.camera.position.x += (GLPlayer.position.x + delta.x*factor - GLPlayer.camera.position.x)/positionEasing;
			//GLPlayer.camera.position.y += (GLPlayer.position.y + delta.y*factor - GLPlayer.camera.position.y)/positionEasing;

			//allow pulling camera in the z dist? not with mostly fixed z
			/*if(dist > maxDist) {
				GLPlayer.camera.position.z += (GLPlayer.position.z + delta.z*factor + playerHeight - GLPlayer.camera.position.z)/easing;
			} else {
				GLPlayer.camera.position.z += Math.abs(GLPlayer.position.z + delta.z*factor + playerHeight - GLPlayer.camera.position.z)/easing+0.1;
			}*/
		}

		//if we're in the inner sanctum, adjust z
		if(Math.sqrt(delta.x*delta.x+delta.y*delta.y) < minDist) {
			//so we know the hypotenuse = minDist
			//var hypotenuse = minDist;
			//deltax^2 + deltay^2 + deltaz^2 = hypotenuse^2
			//the amount to raise z over its default = 
			var squaredValue = minDist*minDist - delta.x*delta.x - delta.y*delta.y;
			if(squaredValue > 0) {
				delta.z = Math.sqrt(squaredValue);
			} else {
				delta.z = 0;
			}
			//GLPlayer.camera.position.z += (GLPlayer.position.z + playerHeight + 2 + deltaZ - GLPlayer.camera.position.z)/positionEasing;
		} else {
			delta.z = 0;
		}

		if(dist < minDist || dist > maxDist) {
			GLPlayer.camera.position.x += (GLPlayer.position.x + delta.x - GLPlayer.camera.position.x)/positionEasing;
			GLPlayer.camera.position.y += (GLPlayer.position.y + delta.y - GLPlayer.camera.position.y)/positionEasing;

			//shouldn't we always be trying to get here?
			//GLPlayer.camera.position.z += (GLPlayer.position.z + camOverShoulder + delta.z - GLPlayer.camera.position.z)/positionEasing;
			
		}
		GLPlayer.camera.position.z += (GLPlayer.position.z + camOverShoulder + delta.z - GLPlayer.camera.position.z)/positionEasing;

		
		//make the camera's z position go towards pos + cam + 
		


		//now, we assume delta is how much they want to change by
		
		//GLPlayer.camera.position.z += (GLPlayer.position.z + playerHeight + 2 - GLPlayer.camera.position.z)/positionEasing;
		//console.log(GLPlayer.camera.position.z);

			var targetAngle = 0;
			if(delta.x == 0) {
				if(delta.y > 0) {
					targetAngle = 0;
				} else {
					targetAngle = Math.PI;
				}
			} else {
				targetAngle = Math.atan(delta.y/delta.x)+Math.PI/2;//+Math.PI/2;
				if(targetAngle < 0) {
					targetAngle += Math.PI;
				}
				if(delta.x >= 0) {
					targetAngle += Math.PI;
				}
			}
			if(targetAngle > Math.PI*2) {
				targetAngle -= Math.PI*2;
			}
			//console.log("ta: "+targetAngle);
			if(Math.abs(GLPlayer.camera.rotation.horizontal - targetAngle) > Math.PI) {
				if(targetAngle > Math.PI) {
					targetAngle -= Math.PI*2;
				} else {
					targetAngle += Math.PI*2;
				}
			}
			GLPlayer.camera.rotation.horizontal += (targetAngle - GLPlayer.camera.rotation.horizontal)/angleEasing;
			GLPlayer.camera.rotation.horizontal %= Math.PI*2;

			delta.x = GLPlayer.position.x - GLPlayer.camera.position.x;
			delta.y = GLPlayer.position.y - GLPlayer.camera.position.y;
			delta.z = GLPlayer.position.z + camOverShoulder - GLPlayer.camera.position.z;

			var landDist = Math.sqrt(delta.x*delta.x + delta.y*delta.y);
			GLPlayer.camera.rotation.vertical = -Math.atan2(delta.z, landDist);
			
			
			//GLPlayer.camera.rotation.vertical = 
		//}

		

	} else {
		//console.log(Aplayer);
	}

	if(!fakeClient) {
		//take a list, remove self from it
		/*var others = [];
		if(state) {
			for(key in state.players) {
				if(!state.players[key].equal(Aplayer)) {
					others.push(state.players[key]);
				}
			}

		}

		drawScene(others);*/
		drawScene(state.players);
	}

	//2d debug stuff?
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, 400, 400);

	if(state) {
		ctx.fillStyle = "red";
		for(key in state.players) {
			var player = state.players[key];
			ctx.fillRect(player.position.x*2-10+200, player.position.y*2-10+200, 20, 20);
		}

		ctx.fillStyle = "green";
		ctx.fillRect(GLPlayer.camera.position.x*2-10+200, GLPlayer.camera.position.y*2-10+200, 20, 20);
	}
}

$(document).ready(function(){

	if(fakeClient) {
		$('body').on('click', '#clientbutton', function(){
			fakeClient = false;
			$(this).hide();
			playerInput.keys.up = false;
		});
	} else {
		$('#clientbutton').hide();
	}

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
			//prevState = state;
			state = exc.payload;
			/*if(state && prevState) {
				for(current in state.players) {
					for(previous = prevState.players) {
						if(state.players[current].equal(prevState.players[previous])) {
							//we found a match!
							state.players[current].prevPlayer = prevState.players[previous];
							break;
						}
					}
				}
			}*/
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
					//console.log("found");
					//console.log(Aplayer);
				} else {
					Aplayer = null;
					//console.log("lost");
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
	}, 1000/localUpdateRate);

	//at 10 fps, send your input to the server
	setInterval(function(){
		if(playerInput) {
			connection.send(JSON.stringify(ServerExchange.new(ServerExchange.TYPE.INPUT, ServerExchange.KEY.INPUT.REQUEST, playerInput)));
		}
	}, 1000/clientInputTransmissionRate);


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

        //update camera
        //GLPlayer.camera.rotation.horizontal = GLPlayer.rotation.horizontal;
        //GLPlayer.camera.rotation.vertical = GLPlayer.rotation.vertical;
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
