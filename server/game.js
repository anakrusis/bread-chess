PLAYER_WHITE = 0;
PLAYER_BLACK = 1;

// a single match between two players
class Game {
	constructor(){
		this.inprogress = false;
		this.id = Math.round(Math.random() * 100000);
		
		this.players = []; // they will be added in before the game starts. these are uuids
		this.moves = [];
		this.board = [[],[],[],[],[],[],[],[]]; // to keep things simple the board is just a simple array of strings
		this.moldytimers = [];
		
		this.MOVESET = {
			"b": [[1,1],[2,2],[3,3],[4,4],[5,5],[6,6],[7,7],[8,8]],
			"k"  : [[1,1],[0,1]],
			"n": [[2,1],[1,2]],
			// pawn is special and doesnt have a symmetrical moveset
			"q" : [[1,1],[2,2],[3,3],[4,4],[5,5],[6,6],[7,7],[8,8],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0]],
			"r"  : [[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0]],
		}
	}
	
	// attempts to put a player in this game. if it can't, its okay, it just wont
	assign(player){
		if( this.inprogress ){ console.log("game in progress, can't assign more players"); return false; }
		
		if(this.players[0]){
			this.players[1] = player.id;
			console.log(player.name + " has the black pieces");
			
		}else if (this.players[1]){
			this.players[0] = player.id;
			console.log(player.name + " has the white pieces");
			
		// if empty game room
		}else{
			var ind = Math.round(Math.random());
			this.players[ind] = player.id;
			
			if (ind == 0){ console.log(player.name + " has the white pieces from random"); }
			else         { console.log(player.name + " has the black pieces from random"); }
		}
		
		player.currentgame = this.id;
		
		// game automatically begins if both players are present. this should prevent any issues
		if (this.players[0] && this.players[1]){
			this.start();
		}
	}
	
	start(){
		if (!this.players[0] || !this.players[1]){
			console.log("Not enough players to start a game!"); return;
		}
		
		// normal yee yee ass setup
		this.board = [["wr","wp",null,null,null,null,"bp","br"],
					  ["wn","wp",null,null,null,null,"bp","bn"],
					  ["wb","wp",null,null,null,null,"bp","bb"],
					  ["wq","wp",null,null,null,null,"bp","bq"],
					  ["wk","wp",null,null,null,null,"bp","bk"],
					  ["wb","wp",null,null,null,null,"bp","bb"],
					  ["wn","wp",null,null,null,null,"bp","bn"],
					  ["wr","wp",null,null,null,null,"bp","br"],		
		];
		
		this.inprogress = true;	
		console.log("Game starting...");
	
		// sends over the names of the players, their ideez, and the board state to begin
		io.to(this.id).emit("gameStart", this.players);
		io.to(this.id).emit("boardUpdate", this.board);
		io.to(this.id).emit("nameUpdate", this.getPlayerNames());
	}
	
	// used a few times for displaying purposes and stuff
	getPlayerNames(){
		var pw = gameserver.players[ this.players[0] ];
		var pb = gameserver.players[ this.players[1] ];
		
		var table = [];
		table[0] = pw ? pw.name : " ";
		table[1] = pb ? pb.name : " ";
		
		return table;
	}
	
	// this function will also contain the restrictions of the bread rolling, in addition to regular chess moves
	getValidMoves(px, py){
		var out = [];
		var piecetype = this.board[px][py].charAt(1);
		var moves = this.MOVESET[ piecetype ];
		
		// special treatment for pawns (TODO)
		if (piecetype == "p"){
			return out;
		}
		// all other pieces
		for ( var angle = 0; angle < Math.PI * 2; angle += Math.PI/2 ){
			for (var i = 0; i < moves.length; i++){	
				// Lololol this is trig to rotate the moves in all four directions
				var mx = Math.round((moves[i][0]) * Math.cos(angle) - (moves[i][1]) * Math.sin(angle));
				var my = Math.round((moves[i][0]) * Math.sin(angle) + (moves[i][1]) * Math.cos(angle));
				var xcoeff = Math.sign(mx); var ycoeff = Math.sign(my);
				
				// Knights can hop over other pieces so they need not check for obstructions
				if (piecetype == "n"){ out.push([ px + mx , py + my ]); continue; }
				
				// This loop checks for pieces between the current space and the target space
				var obstructed = false;
				var currentx = px; var currenty = py;
				var count = 0;
				while ( currentx != px + mx || currenty != py + my ){
					
					currentx += xcoeff; currenty += ycoeff;
					
					if (this.board[currentx]){
						var p = this.board[currentx][currenty];
						if (p){
							// sliding pieces can capture the first piece in their line of view
							// (todo configurable friendly fire)
							out.push([ currentx , currenty ]);
							obstructed = true; break;
						}
					}
					
					// There is no reason for any piece to move 15 spaces out
					// It's just a preventative measure in case the loop might get stuck infinitely going out
					count++; if (count > 15){ break; }
				}
				
				if (obstructed){ continue; }
				out.push([ px + mx , py + my ]);
			}
		}
		
		// TODO trim all elements with out of bounds indices
		
		// TODO trim all redundant elements
		
		return out;
	}
}

module.exports = Game;