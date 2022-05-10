// a single match between two players
class Game {
	constructor(){
		this.id = Math.round(Math.random() * 100000);
		
		this.playerw = null; // they will be added in before the game starts. these are uuids
		this.playerb = null;
		
		this.board = [[],[],[],[],[],[],[],[]]; // to keep things simple the board is just a simple array of strings
		this.moldytimers = [];
	}
	
	start(){
		if (!this.playerw || !this.playerb){
			console.log("Not enough players to start a game!"); return;
		}
		
		// normal yee yee ass setup
		this.board = [["wr","wn","wb","wq","wk","wb","wn","wr"],
					  ["wp","wp","wp","wp","wp","wp","wp","wp"],
					  [],[],[],[],
					  ["bp","bp","bp","bp","bp","bp","bp","bp"],
					  ["br","bn","bb","bq","bk","bb","bn","br"]]
						
	}
}