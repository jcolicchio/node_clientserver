(function(exports){
	var GoBoard = {};
	
	GoBoard.TEAM = {};
	GoBoard.TEAM.EMPTY = -1;
	GoBoard.TEAM.BLACK = 0;
	GoBoard.TEAM.WHITE = 1;
	
	//the board should be a smart data structure, when you try to modify the data, it tells you if you can or not
	GoBoard.new = function(size) {
		var board = {
			size: size,
			width: size,
			height: size,
			turn: GoBoard.TEAM.BLACK,
			data: [],
			winner: function() {
				for(var i=0;i<this.size;i++) {
					for(var j=0;j<this.size;j++) {
						var startVal = this.data[i][j];
						if(startVal == GoBoard.TEAM.EMPTY) {
							continue;
						}
						var validRow = true;
						var validCol = true;
						var validDiag = true;
						var validDiag2 = true;
						for(var k=1;k<5;k++) {
							if(i+k >= this.size || j+k >= this.size || this.data[i+k][j+k] != startVal) {
								validDiag = false;
							}
							if(i-k < 0 || j+k >= this.size || this.data[i-k][j+k] != startVal) {
								validDiag2 = false;
							}
							if(j+k >= this.size || this.data[i][j+k] != startVal) {
								validRow = false;
							}
							if(i+k >= this.size || this.data[i+k][j] != startVal) {
								validCol = false;
							}
							if(!validRow && !validCol && !validDiag && !validDiag2) {
								break;
							}
						}
						if(validRow || validCol || validDiag || validDiag2) {
							return startVal;
						}
					}
				}
				return GoBoard.TEAM.EMPTY;
			},
			placePiece: function(player, x, y) {
				if(player == GoBoard.TEAM.EMPTY) {
					console.log("invalid team: "+player);
					return false;
				}
				if(player != this.turn) {
					console.log("not your turn: "+player);
					return false;
				}
				if(this.data[y][x] != GoBoard.TEAM.EMPTY) {
					console.log(x+","+y+": not empty");
					return false;
				}
				this.data[y][x] = player;
				if(this.winner() !== GoBoard.TEAM.EMPTY) {
					this.turn = GoBoard.TEAM.EMPTY;
				} else {
					this.turn = (this.turn == GoBoard.TEAM.WHITE) ? GoBoard.TEAM.BLACK : GoBoard.TEAM.WHITE;
				}
				return true;
			},
			init: function() {
				this.data = [];
				for(var i=0;i<this.size;i++) {
					var row = [];
					for(var j=0;j<this.size;j++) {
						row.push(GoBoard.TEAM.EMPTY);
					}
					this.data.push(row);
				}
				this.turn = GoBoard.TEAM.BLACK;
			}
		}
	
		board.init();
		return board;
	}
	
	GoBoard.import = function(json) {
		var b = JSON.parse(json);
		return GoBoard.copy(b);
	}
	
	GoBoard.copy = function(b) {
		var board = GoBoard.new();
		board.size = b.size;
		board.width = b.width;
		board.height = b.height;
		board.turn = b.turn;
		board.data = b.data;
		return board;
	}
	
	GoBoard.default = function() {
		var board = GoBoard.new(17);
		board.turn = GoBoard.TEAM.BLACK;
		board.init();
		return board;
	}
	
	exports.TEAM = GoBoard.TEAM;
	exports.new = GoBoard.new;
	exports.import = GoBoard.import;
	exports.copy = GoBoard.copy;
	exports.default = GoBoard.default;
})(typeof exports === 'undefined'? this['GoBoard']={}: exports);
