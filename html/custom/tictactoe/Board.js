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
                return this;
            },
            applyCommand: function(team, target) {
                // team x is 1, team o is 2
                if (this.data !== null && this.data[0] !== null)
                	this.data [target.x][target.y] = team;
            },
            winner: function() {
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
