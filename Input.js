(function(exports){
	Input = {};

	var defaultKeys = {up: false, down: false, left: false, right: false};
	
	Input.new = function(keys, angle) {
		var cmd = {
			keys: keys || defaultKeys,
			angle: angle || 0,
			keyDown: function(keyCode) {
				this.keySwitch(keyCode, true);
			},
			keyUp: function(keyCode) {
				this.keySwitch(keyCode, false);
			},
			keySwitch: function(keyCode, value) {
				if(keyCode == 38) {
					this.keys.up = value;
				} else if(keyCode == 40) {
					this.keys.down = value;
				} else if(keyCode == 37) {
					this.keys.left = value;
				} else if(keyCode == 39) {
					this.keys.right = value;
				}
			}
		};
		return cmd;
	};
	
	Input.import = function(json) {
		var cmd = JSON.parse(json);
		return Input.copy(cmd);
	};
	
	Input.copy = function(c) {
		if(c === undefined || c === null) {
			return c;
		}
		return Input.new(c.keys, c.angle);
	};
	
	exports.new = Input.new;
	exports.import = Input.import;
	exports.copy = Input.copy;
})(typeof exports === 'undefined'? this['Input']={}: exports);
