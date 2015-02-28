(function(exports){

	var Protocol = this['Protocol'];
	if(Protocol === undefined) {
		Protocol = require('../../server/Protocol.js');	
	}
	var Player = this['Player'];
	if(Player === undefined) {
		Player = require('./Player.js');	
	}

	exports.new = function(width, height, data, teams, turn, gamePlayers) {
		var board = {
			width: width,
			height: height,
			data: data,
			teams: teams,
			turn: turn,
			gamePlayers: gamePlayers,
			init: function() {
				// this is a total rats nest

				var squares = this.width*this.height;
				var squaresPerTeam = Math.floor(squares/teams);
				var squaresLeft = [];
				for(var i=0;i<teams;i++) {
					squaresLeft.push(squaresPerTeam);
				}
				// now squaresLeft is a count of which teams have how many territories left to own

				this.data = [];
				for(var i=0;i<this.height;i++) {
					var row = [];
					for(var j=0;j<this.width;j++) {
						// figure out the team
						var team = -1;
						while(team == -1) {
							var team = Math.floor(Math.random()*teams);
							if(squaresLeft[team] > 0) {
								squaresLeft[team] -= 1;
								var usedUp = true;
								for(var k=0;k<teams;k++) {
									if(squaresLeft[k] != 0) {
										usedUp = false;
										break;
									}
								}
								if(usedUp) {
									for(var k=0;k<teams;k++) {
										squaresLeft[k] = 1;
									}
								}
							} else {
								team = -1;
							}
						}
						row.push({team:team, count: 1});
					}
					this.data.push(row);
				}
				// now for each player, add N randomly to a random one of their territories
				for(var i=0;i<2*squaresPerTeam;i++) {
					for(var j=0;j<teams;j++) {
						// find a random square of team j, add 1
						var square = null;
						while(!square) {
							var x = Math.floor(Math.random()*this.width);
							var y = Math.floor(Math.random()*this.height);
							if(this.data[y][x].team == j) {
								square = this.data[y][x];
							}
						}
						square.count += 1;
					}
				}

				var sums = [];
				var territories = [];
				for(var i=0;i<teams;i++) {
					sums.push(0);
					territories.push(0);
				}
				for(var i=0;i<this.height;i++) {
					for(var j=0;j<this.width;j++) {
						var s = this.data[i][j];
						sums[s.team] += s.count;
						territories[s.team] += 1;
					}
				}
				console.log(sums);
				console.log(territories);
				return this;
			},
			applyCommand: function(command) {
				//TODO: territory limit, no turtling
				if(command.endTurn) {
					// reinforce, gain +N for every territory, scattered across all team units
					var territoryCount = 0;
					for(var i=0;i<this.width;i++) {
						for(var j=0;j<this.height;j++) {
							if(this.data[j][i].team == this.turn) {
								territoryCount += 1;
							}
						}
					}
					var reinforcements = territoryCount*2;
					while(reinforcements > 0) {
						// pick a random spot, if it's team's, give it +1
						var x = Math.floor(Math.random()*this.width);
						var y = Math.floor(Math.random()*this.height);
						var s = this.data[y][x];
						if(s.team == this.turn) {
							reinforcements -= 1;
							s.count += 1;
						}
					}
					this.turn += 1;
					if(this.turn >= this.teams) {
						this.turn = 0;
					}
					return true;
				}
				var sX = Math.floor(command.source.x);
				var sY = Math.floor(command.source.y);
				var dX = Math.floor(command.dest.x);
				var dY = Math.floor(command.dest.y);
				if(sX < 0 || sX >= this.width ||
					sY < 0 || sY >= this.height ||
					dX < 0 || dX >= this.width ||
					dY < 0 || dY >= this.height) {
					//invalid
					console.log("invalid coords");
					return false;
				}
				if(Math.abs(sX - dX) + Math.abs(sY - dY) != 1) {
					// invalid
					console.log("invalid command");
					return false;
				}

				var source = this.data[sY][sX];

				if(source.team != this.turn) {
					// invalid
					console.log("not your turn");
					return false;
				}
				if(source.count <= 1) {
					console.log("cant attack with 1!");
					return false;
				}

				var dest = this.data[dY][dX];
				if(source.team == dest.team) {
					// invalid
					console.log("dest same team");
					return false;
				}

				// roll da dice!
				var attackSum = 0;
				for(var i=0;i<source.count;i++) {
					attackSum += Math.floor(Math.random()*6)+1;
				}
				var defenseSum = 0;
				for(var i=0;i<dest.count;i++) {
					defenseSum += Math.floor(Math.random()*6)+1;
				}
				console.log("attack " + attackSum + " vs defense " + defenseSum);
				if(attackSum > defenseSum) {
					// defense loses, attacker moves count-1 dice to defender
					dest.team = source.team;
					dest.count = source.count - 1;
					source.count = 1;
				} else {
					source.count = 1;
				}
				return {attack: attackSum, defense: defenseSum};
			},
			winner: function() {
				var team = this.data[0][0];
				for(var i=0;i<this.height;i++) {
					for(var j=0;j<this.width;j++) {
						if(this.data[i][j].team != team) {
							return -1;
						}
					}
				}
				return team;
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
		return exports.new(b.width, b.height, b.data, b.teams, b.turn, gp);
	}
	exports.import = function(json) {
		return exports.copy(JSON.parse(json));
	}


	// **** Protocol Registration ****

	Protocol.register("Board", function(payload) {
		return exports.copy(payload);
	});

})(typeof exports === 'undefined'? this['Board']={}: exports);