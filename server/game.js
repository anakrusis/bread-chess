PLAYER_WHITE = 0;
PLAYER_BLACK = 1;

// a single match between two players
class Game {
	constructor(){
		this.id = Math.round(Math.random() * 100000);
		
		this.players = []; // they will be added in before the game starts. these are uuids
		
		this.board = [[],[],[],[],[],[],[],[]]; // to keep things simple the board is just a simple array of strings
		this.moldytimers = [];
		
		this.inprogress = false;
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
}

module.exports = Game;