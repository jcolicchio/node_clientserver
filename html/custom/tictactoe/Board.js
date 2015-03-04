(function(exports){
    var Protocol = this['Protocol'];
    if(Protocol === undefined) {
        Protocol = require('../../server/Protocol.js');
    }
    var Player = this['Player'];
    if(Player === undefined) {
        Player = require('./Player.js');
    }

    exports.new = function(turn, teams, data, gamePlayers) {
        var board = {
            turn: turn,
            teams: teams,
            data: data,
            gamePlayers: gamePlayers,
            init: function() {
                //create a fresh gameboard
                this.data = [[0,0,0],[0,0,0],[0,0,0]];
		this.turn = 0;
                return this;
            },
            applyCommand: function(team, target) {
                // team x is 1, team o is 2
                if ((this.turn % 2) + 1 != team)
		    return false;
                if (this.data !== null && this.data[0] !== null
		        && this.data [target.x][target.y] === 0) {
                    this.data [target.x][target.y] = team;
		    this.turn++;
		}
		return true;
            },
            winner: function() {
		//check rows
		for(var row=0;row<3;row++){
		    if(this.data[row][0] != 0 &&
		       this.data[row][0] == this.data[row][1] &&
		       this.data[row][1] == this.data[row][2])
			return this.data[row][0];
		}
			
		//check cols
		for(var col=0;col<3;col++){
		    if(this.data[0][col] != 0 &&
		       this.data[0][col] == this.data[1][col] &&
		       this.data[1][col] == this.data[2][col])
			return this.data[0][col];
		}

		//check dias
		if(this.data[1][1] != 0 &&
		   (this.data[0][0] == this.data[1][1] &&
		    this.data[1][1] == this.data[2][2]) ||
		   (this.data[0][2] == this.data[1][1] &&
		    this.data[1][1] == this.data[2][0]))
		    return this.data[1][1];

		return 0;
            }
        }
        return board;
    }
    exports.copy = function(b) {
        if(!b) {
            return null;
        }
        var gp = [];
        for(key in b.gamePlayers) {
            gp.push(Player.copy(b.gamePlayers[key]));
        }
        return exports.new(b.turn, b.teams, b.data, gp);
    }
    exports.import = function(json) {
        return exports.copy(JSON.parse(json));
    }

    // **** Protocol Registration ****

    Protocol.register("Board", function(payload) {
        return exports.copy(payload);
    });

})(typeof exports === 'undefined'? this['Board']={}: exports);
