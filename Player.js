(function(exports){
	var Player = {};

	var Input = this['Input'];
	if(Input === undefined) {
		Input = require('./Input.js');
	}
	
	Player.new = function(id, name) {
		var player = {
			id: id,
			name: name,
			//connection: connection,
			equal: function(player) {
				if(player === undefined || player === null) {
					return false;
				}
				return (this.id == player.id && this.name == player.name /*&& this.connection == player.connection*/);
			},
			position: {x: 0.0, y: 0.0},
			velocity: {x: 0.0, y: 0.0},
			input: Input.new(),
			update: function() {
				//add velocity to position
				//modify velocity based on input and time
				//this means slow down by friction, then add input dir if necessary

				this.position.x += this.velocity.x;
				this.position.y += this.velocity.y;

				var speed = 0.1;
				var friction = 0.8;
				this.velocity.x *= friction;
				this.velocity.y *= friction;

				if(this.input.keys.up) { // w
                    this.velocity.x -= Math.sin(this.input.angle)*speed;
                    this.velocity.y += Math.cos(this.input.angle)*speed;
                    //console.log(this.input.angle+", "+this.velocity.x+", "+this.velocity.y);
                }
                if(this.input.keys.down) { // s
                    this.velocity.x += Math.sin(this.input.angle)*speed;
                    this.velocity.y -= Math.cos(this.input.angle)*speed;
                }
                if(this.input.keys.left) { // a
                    this.velocity.x += Math.cos(this.input.angle)*speed;
                    this.velocity.y += Math.sin(this.input.angle)*speed;
                }
                if(this.input.keys.right) { // d
                    this.velocity.x -= Math.cos(this.input.angle)*speed;
                    this.velocity.y -= Math.sin(this.input.angle)*speed;
                }
			}
		};
		return player;
	};
	
	Player.import = function(json) {
		var p = JSON.parse(json);
		return Player.copy(p);
	};
	
	Player.copy = function(p) {
		if(p === undefined || p === null) {
			return p;
		}
		var player = Player.new(p.id, p.name);
		player.position = p.position;
		player.velocity = p.velocity;
		player.input = Input.copy(p.input);
		return player;
	};
	
	exports.new = Player.new;
	exports.import = Player.import;
	exports.copy = Player.copy;
})(typeof exports === 'undefined'? this['Player']={}: exports);
