// a single match between two players
class Game {
	constructor(){
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
		this.board = [["rw","nw","bw","qw","kw","bw","nw","rw"],
					  ["pw","pw","pw","pw","pw","pw","pw","pw"],
					  [],[],[],[],
					  ["pb","pb","pb","pb","pb","pb","pb","pb"],
					  ["rb","nb","bb","qb","kb","bb","nb","rb"]]
						
	}
}