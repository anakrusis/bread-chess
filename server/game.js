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
		if( this.inprogress ){ return false; }
		
		if(this.players[0]){
			this.players[1] = player.id;
			
		}else if (this.players[1]){
			this.players[0] = player.id;
			
		// if empty game room
		}else{
			var ind = Math.round(Math.random());
			this.players[ind] = player.id;
		}
		
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
		this.board = [["wr","wn","wb","wq","wk","wb","wn","wr"],
					  ["wp","wp","wp","wp","wp","wp","wp","wp"],
					  [],[],[],[],
					  ["bp","bp","bp","bp","bp","bp","bp","bp"],
					  ["br","bn","bb","bq","bk","bb","bn","br"]]
		
		this.inprogress = true;
		
		console.log("Game starting...");
		io.to(this.id).emit("gameStart");
		io.to(this.id).emit("boardUpdate", this.board);
	}
}

module.exports = Game;