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
		this.castlingrights = [[true,true],[true,true]]; // each player has a table for this, kingside then queenside
		this.moldytimers = [];
		this.turn = 0; // index of the player whose turn it is
		
		this.bread = null; // will be replaced with a string indicating the state of the bread at this moment
		
		this.MOVESET = {
			"b": [[1,1],[2,2],[3,3],[4,4],[5,5],[6,6],[7,7],[8,8]],
			"k"  : [[1,1],[0,1]],
			"n": [[2,1],[1,2]],
			// pawn is special and doesnt handle its moveset like the rest
			"p" : [],
			"q" : [[1,1],[2,2],[3,3],[4,4],[5,5],[6,6],[7,7],[8,8],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0]],
			"r"  : [[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0]],
		}
		
		this.startingfen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
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
		var newboard = this.newBoard( this.startingfen) ;
		if (newboard){
			this.board = newboard;
		}
		
		this.inprogress = true;	
		console.log("Game starting...");
	
		// sends over the names of the players, their ideez, and the board state to begin
		io.to(this.id).emit("gameStart", this.players);
		io.to(this.id).emit("boardUpdate", this.board);
		io.to(this.id).emit("nameUpdate", this.getPlayerNames());
		
		// the bread should be rolled the initial time
		this.bread = this.rollUntilLegal();
		io.to(this.id).emit("breadRoll", this.bread);
	}
	
	newBoard(fen){
		var validpieces = ["b","k","n","p","r","q"];
		var newboard = [[],[],[],[],[],[],[],[]];
		
		var section = 0; var currx = 0; var curry = 7;
		
		for (var i = 0; i < fen.length; i++){
			var ch = fen.charAt(i);
			// fen format has several sections seperated by spaces. they are:
			if (ch == " "){ section++; continue; }
			
			// out of bounds?? this cant be a valid fen!
			if (curry > 7 || curry < 0 || currx > 8 || currx < 0){ return false; }
			
			// piece placement on board
			if (section == 0){
				if (ch == "/"){
					currx = 0; curry--;
					
				// numbers indicate blank areas on the board
				}else if (parseInt(ch)){
					for (var q = 0; q < parseInt(ch); q++){
						if (newboard[currx]){
							newboard[currx][curry] = null; currx++;
						}
					}
					
				// everything else could be a piece letter, so we check for those
				}else{
					var lower = ch.toLowerCase();
					var newpiece;
					if (validpieces.indexOf(lower) != -1){
						// lowercase characters are black pieces and uppercase are white pieces
						newpiece = lower == ch ? "b" : "w";
						newpiece += lower;
						if (newboard[currx]){
							newboard[currx][curry] = newpiece; currx++;
						}
					}
				}	
				
			// who is to move
			}else if (section == 1){
				
			}
		}
		
		return newboard;
	}
	
	// gets piece string from board without crashing if index out of bounds
	pieceAt(x,y){
		if (!this.board[x]){ return null; }
		return this.board[x][y];
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
	
	// must be called before the move is committed.
	// (why? because if there is a piece on the target square then it will be able to tell, and mark the move with "x")
	getMoveName(startx, starty, targetx, targety){
		var alphabet = ["a","b","c","d","e","f","g","h"];
		
		var targetpiece = this.pieceAt(targetx,targety);
		var startpiece = this.pieceAt(startx,starty);
		var startpiecetype = startpiece.charAt(1);
		var startpiececolor = startpiece.charAt(0);
		
		if (startpiecetype != "p"){
			var out = startpiecetype.toUpperCase();
		}else{
			// if capturing with a pawn, say the file name
			if (targetpiece){
				var out = alphabet[startx];
			}else{
				var out = "";
			}
		}
		
		// castling has special move names
		if (startpiecetype == "k"){
			if (targetx - startx == 2){
				return "O-O";
			}else if (targetx - startx == -2){
				return "O-O-O";
			}
		}
		// Disambiguating when two or more pieces can go to the same square
		if (startpiecetype != "p" && startpiecetype != "k"){
			var temppiece = startpiececolor == "w" ? "b" : "w"; temppiece = temppiece + startpiecetype;
			this.board[targetx][targety] = temppiece;
			var temppiecemoves = this.getValidMoves(targetx,targety);
			var pieces_on_file = 1; var pieces_on_rank = 1;
			
			// creates an imaginary enemy piece on the destination square, and gets its valid moves 
			// if it can capture a friendly piece of the same type on a different square as the original piece
			// then we will count how many of these same type pieces share the ranks and files
			
			for (var i = 0; i < temppiecemoves.length; i++){
				var movex = temppiecemoves[i][0]; var movey = temppiecemoves[i][1];
				var currpiece = this.pieceAt(movex,movey);
				if (!currpiece){ continue; }
				if (movex == startx && movey == starty){ continue; }
				
				if (currpiece.charAt(0) == startpiececolor && currpiece.charAt(1) == startpiecetype){
					if (movex == startx){
						pieces_on_file++;
					}
					if (movey == starty){
						pieces_on_rank++;
					}
				}
			}
			// if more than two pieces share a rank, the file is specified
			// if more than two pieces share a file, rank is specified
			// both can be specified if neccessary too
			if (pieces_on_rank > 1){
				out = out + alphabet[startx];
			}
			if (pieces_on_file > 1){
				out = out + (starty + 1);
			}
			this.board[targetx][targety] = targetpiece;
		}
		
		// takes
		if (targetpiece){
			out = out + "x";
		}
	
		var file = alphabet[targetx];
		var rank = targety + 1;
		
		out = out + file + rank;
		console.log(out);
		return out;
	}
	
	// this function will also contain the restrictions of the bread rolling, in addition to regular chess moves
	getValidMoves(px, py){
		var out = [];
		// this is used to store a parallel array containing single-number values instead of two-item arrays for moves
		// which significantly reduces the complexity of the trimming functions later on
		var paired_array = [];
		
		var piecetype  = this.board[px][py].charAt(1);
		var piececolor = this.board[px][py].charAt(0);
		var playerindex = piececolor == "b" ? 1 : 0;
		var moves = this.MOVESET[ piecetype ];
		
		// castling
		if (piecetype == "k"){
			// kingside castling
			if (this.castlingrights[playerindex][0]){
				if ( 
					this.board[ px + 3 ][ py ] == (piececolor + "r") && // our rook in the right spot
					this.board[ px + 2 ][ py ] == null && // nothing in the king's knight's spot
					this.board[ px + 1 ][ py ] == null    // nothing in the king's bishop's spot
				){		
					out.push([ px + 2 , py ]); 
					paired_array.push( py * 8 + (px + 2));
					console.log("can castle kingside");
				}
				
			}
			// queenside castling
			if (this.castlingrights[playerindex][1]){
				if (
					this.board[ px - 4 ][ py ] == (piececolor + "r") && // our rook in the right spot
					this.board[ px - 3 ][ py ] == null && // nothing in queens knights spot
					this.board[ px - 2 ][ py ] == null && // nothing in queenes bishops spot
					this.board[ px - 1 ][ py ] == null    // nothing in queenes spot
				){
					out.push([ px - 2 , py ]); 
					paired_array.push( py * 8 + (px - 2));
					console.log("can castle queenside");
				}
			}
		}
		
		// special treatment for pawns
		if (piecetype == "p"){
			var currentx; var currenty;
			
			// one square pawn push
			var osy = piececolor == "b" ? -1 : 1;
			var onesquarelegal = false;
			currenty = py + osy;
			if (!this.pieceAt( px, currenty )){
				out.push([ px , currenty ]);
				onesquarelegal = true;
			}
			
			// two square pawn push, only on starting rank
			var tsy = piececolor == "b" ? -2 : 2;
			var startrank = piececolor == "b" ? 6 : 1;
			if (onesquarelegal && py == startrank){
				currenty = py + tsy;
				if (!this.pieceAt(px, currenty)){
					out.push([ px , currenty ]);
				}
			}
			
			// captures (in both directions)
			var cpx = 1; var cpy = piececolor == "b" ? -1 : 1;
			for (var i = 0; i < 2; i++){
				currentx = px + cpx; currenty = py + cpy;
				if (this.pieceAt(currentx,currenty)){
					out.push([ currentx , currenty ]);
				}
				cpx *= -1;
			}
			
			// todo add en passant lol
			
			return out;
		}
		// all other pieces
		for ( var angle = 0; angle < Math.PI * 2; angle += Math.PI/2 ){
			for (var i = 0; i < moves.length; i++){	
				// Lololol this is trig to rotate the moves in all four directions
				var mx = Math.round((moves[i][0]) * Math.cos(angle) - (moves[i][1]) * Math.sin(angle));
				var my = Math.round((moves[i][0]) * Math.sin(angle) + (moves[i][1]) * Math.cos(angle));
				var xcoeff = Math.sign(mx); var ycoeff = Math.sign(my);
				
				// Knights can hop over other pieces so they need not check for obstructions.
				if (piecetype == "n"){ 
					out.push([ px + mx , py + my ]); 
					paired_array.push( ((py + my) * 8) + (px + mx));
					continue; 
				}
				// All the code underneath is skipped for knights, and applies to all the sliding pieces
				
				// This loop checks for pieces between the current space and the target space
				var obstructed = false;
				var currentx = px; var currenty = py;
				var count = 0;
				while ( currentx != px + mx || currenty != py + my ){		
					currentx += xcoeff; currenty += ycoeff;
					
					var p = this.pieceAt(currentx, currenty);
					if (p){
						// sliding pieces can capture the first piece in their line of view
						// (todo configurable friendly fire)
						out.push([ currentx , currenty ]);
						paired_array.push( (currenty * 8) + currentx );
						obstructed = true; break;
					}
					// There is no reason for any piece to move 15 spaces out
					// It's just a preventative measure in case the loop might get stuck infinitely going out
					count++; if (count > 15){ break; }
				}
				
				if (obstructed){ continue; }
				out.push([ px + mx , py + my ]);
				paired_array.push( ((py + my) * 8) + (px + mx));
			}
		}
		console.log("length: " + out.length);
		
		// trims all elements with out of bounds indices
		for (var i = 0; i < out.length; i++){
			if( out[i][0] > 7 || out[i][0] < 0){ out.splice(i,1); paired_array.splice(i,1); i--; }
		}
		for (var i = 0; i < out.length; i++){
			if( out[i][1] > 7 || out[i][1] < 0){ out.splice(i,1); paired_array.splice(i,1); i--; }
		}
		
		console.log("length after oob trim: " + out.length);
		
		// trims all redundant elements based off the pairing function value of the coordinates
		for (var i = 0; i < out.length; i++){			
			var pairedvalue = (out[i][1] * 8) + out[i][0];
			//console.log(paired_array[i] + ", expected " + pairedvalue);
			var pairedindex = paired_array.indexOf( pairedvalue );
			if ( pairedindex != i ){
				out.splice(i,1); paired_array.splice(i,1); i--;
			}
		}
		console.log("length after redundant trim: " + out.length);
		console.log(" ");
		
		return out;
	}
	
	roll(){
		var num = Math.floor(Math.random() * 16) + 2;
		if (num == 17){
			// special bread has a 1/16 chance for now
			// (I changed it so that the 1 bread doesnt have a disproportionate low number, which would
			// affect the chances of a-file and 1-rank stuff)
			if (Math.random() < 1/3){
				return "special" + Math.floor( 7 * Math.random() + 1 );
			}
		}
		return Math.floor(num / 2);
	}
	
	// given a bread roll, returns the legal squares that the bread roll limits the moves to
	getLegalSquaresByBread(bread){
		var legalsquares = [];
			
		// x values (y values not decided yet are set to null for now)
		if (parseInt(bread[0])){
			legalsquares.push( [ bread[0] - 1, null ] );
		}else{
			for (var i = 0; i < 8; i++){
				legalsquares.push( [ i, null ] );
			}
		}
		var lengthbefore = legalsquares.length; // to prevent infinite loops you know
		
		// y values (those null values are now replaced)
		if (parseInt(bread[1])){
			for (var i = 0; i < lengthbefore; i++){
				legalsquares[i][1] = bread[1] - 1;
				legalsquares.push([ legalsquares[i][0], 7 - legalsquares[i][1] ]);
			}
		}else{
			for (var i = 0; i < lengthbefore; i++){
				legalsquares[i][1] = 0;
				for (var j = 1; j < 8; j++){
					legalsquares.push( [ legalsquares[i][0], j ] );
				}
			}
		}
		console.log("legal squares:");
		for (var i = 0; i < legalsquares.length; i++){
			console.log("x: " + legalsquares[i][0] + " y: " + legalsquares[i][1]);
		}
		return legalsquares;
	}
	
	// removes moves from the list which are not approved by the bread
	trimMovesByBread(moves){
		var legalsquares = this.getLegalSquaresByBread( this.bread );
		var newmoves = [];
		for (var i = 0; i < moves.length; i++){
			
			var allowed = false;
			for (var j = 0; j < legalsquares.length; j++){
				if ( moves[i][0] == legalsquares[j][0] && moves[i][1] == legalsquares[j][1] ){
					allowed = true; break;
				}
			}
			if (allowed){
				newmoves.push( moves[i] );
			}
		}
		console.log("length after bread trim: " + newmoves.length);
		return newmoves;
	}
	
	rollUntilLegal(){
		// there are only 64 possible squares, so i think this is a fair amount of tries to hopefully exhaust all possibilities
		// TODO maybe we can shuffle a list with the 64 squares to avoid any redundant move calculation (might have to rewrite bread func to do it)
		
		// Also this is the most insane nested loop disaster i have ever done
		
		var bread;
		for (var q = 0; q < 300; q++){
			bread = [this.roll(), this.roll()];
			var legalsquares = this.getLegalSquaresByBread(bread);
			
			// we will look at every one of our pieces until we find one that can go to any one of the legal squares
			var legalmovefound = false;
			for (var i = 0; i < legalsquares.length; i++){
				
				for (var x = 0; x < 8; x++){
					for (var y = 0; y < 8; y++){
						var currpiece = this.board[x][y];
						// if no piece, or not our piece then we skip
						if (!currpiece){ continue; }
						var currpiececolor = this.board[x][y].charAt(0);
						var expectedcolor = this.turn == 0 ? "w" : "b";
						if (currpiececolor != expectedcolor){ continue; }
						
						var currpiecemoves = this.getValidMoves(x,y);
						for (var z = 0; z < currpiecemoves.length; z++){
							
							if (legalsquares[i][0] == currpiecemoves[z][0] && legalsquares[i][1] == currpiecemoves[z][1]){
								
								console.log("legal move found from bread. piece at " + x + ", " + y);
								legalmovefound = true;
								return bread;
							}
						}
					}
				}
				
			}
		}
		// TODO no legal moves is probably stalemate
		//
		console.log("bread permits no moves");
		return false;
	}
	
	// closes the sockets and ends the game
	end(endingtype, winnerindex){
		io.to(this.id).emit("gameEnd", endingtype, winnerindex);
		for (var i = 0; i < this.players.length; i++){
			var pid = this.players[i];
			console.log(pid);
			var socketid = gameserver.players[pid].socket;
			io.sockets.sockets.get(socketid).disconnect();
		}
	}
}

module.exports = Game;