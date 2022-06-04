// Chess server

var config = require('./config.js');
var Game = require('./game.js');

const { Server } = require("socket.io");
io = new Server(config.PORT, { 
	cors: {
		origin: "http://127.0.0.1:8887",
		allowedHeaders: ["my-custom-header"],
		credentials: true
	} 
});

class Player {
	constructor(id){
		this.id = Math.round(Math.random() * 100000);
		this.name = "Player" + this.id;
		this.type = this.constructor.name;
		this.currentgame = null;
	}
}

class GameServer {
	
	constructor(){		
		this.games = {};
		this.players = {};
	}
	init(){
		console.log("Starting server on port " + config.PORT + "\n")
		
		// Initialize game propertys
		this.players = {};
		this.games = {};
		
		// Initialize command line parsing for server owner
		const readline = require('readline');
		const rl = readline.createInterface({
		  input:  process.stdin,
		  output: process.stdout,
		  prompt:""
		});
		rl.on('line', (line) => {
			var firstArg = line.trim().split(' ')[0]
			switch (firstArg) {
				
				case "/stop":
					console.log("Stopping server...");
					process.exit(0);
					break;
				
				case "/list":
					console.log("Games: " + Object.keys(gameserver.games).length);
					console.log("Players: " + Object.keys(gameserver.players).length);
					console.log("");
					
					for (var index in gameserver.games){
						var g = gameserver.games[index];
						console.log("Game " + g.id);
						console.log(g.players[0]);
						console.log(g.players[1]);
					}
				
/* 					for (var index in gameserver.players){
						console.log ( gameserver.players[index].name + " (ID: " + gameserver.players[index].id + ")" )
					}
					if (Object.keys(gameserver.players).length == 0){
						console.log("No players online!")
					} */
					console.log("");
					break;
					
				// just a debug function, doesnt do anything
				case "/roll":
					for (var index in gameserver.games){
						var g = gameserver.games[index];
						console.log(g.roll());
					}
					break;
			}
		});
		
		// first event when a player joins for the first time
		io.on('connection', function (socket) {
			
			if (Object.keys(gameserver.players).length >= gameserver.MAX_PLAYERS){ return; }
	
			var playerJoining = new Player();
			
			// this is used to tell the player that they have joined the server. it also gives them their new id
			socket.emit("playerJoin", playerJoining.id);
						
			gameserver.players[playerJoining.id] = playerJoining;				
			gameserver.players[playerJoining.id].socket = socket.id;			
			console.log(playerJoining.name + " has joined the server (ID: " + playerJoining.id + ")" )
			
			var gamejoined = false;
			
			// here is where we will matchmake the player to a game
			for (var index in gameserver.games){
				var g = gameserver.games[index];
				
				if (!g.inprogress){
					socket.join(g.id);
					g.assign(playerJoining);
					gamejoined = true;
				}
			}
				
			// if there is no games available then create a new game, and randomly assign first player to black or white
			if (!gamejoined){
				var g = new Game();
				gameserver.games[g.id] = g;
				
				socket.join(g.id);
				g.assign(playerJoining);
			}

			socket.on("nameChangeRequest", function(newname){
				var p = gameserver.getPlayerFromSocket(this);
				if (!p){ return; }
				p.name = newname;
				
				// if player is in a game, then we broadcast the new name to all players in the same room
				if (!p.currentgame){ return; }
				var g = gameserver.games[p.currentgame];
				io.to(p.currentgame).emit("nameUpdate", g.getPlayerNames());
			});
			
			socket.on("validMovesRequest", function(piecex, piecey){
				var p = gameserver.getPlayerFromSocket(this);
				if (!p.currentgame){ return; }
				var g = gameserver.games[p.currentgame];
				
				// if it's not your piece or not your turn, get out
				if (p.id != g.players[ g.turn ]){ return; }
				var expectedpiececolor = g.players.indexOf(p.id) == 0 ? "w" : "b";
				if (expectedpiececolor != g.board[piecex][piecey].charAt(0)){ return; }
				
				var moves = g.getValidMoves(piecex, piecey);
				moves = g.trimMovesByBread(moves);
				socket.emit("validMoves", moves);
			});
			
			socket.on("pieceMoveRequest", function(startx, starty, targetx, targety){
				var p = gameserver.getPlayerFromSocket(this);
				if (!p.currentgame){ return; }
				var g = gameserver.games[p.currentgame];
				
				// if it's not your piece or not your turn, get out
				if (p.id != g.players[ g.turn ]){ return; }
				var expectedpiececolor = g.players.indexOf(p.id) == 0 ? "w" : "b";
				if (expectedpiececolor != g.board[startx][starty].charAt(0)){ return; }
				
				// looks for legal move
				var moves = g.getValidMoves(startx, starty);
				moves = g.trimMovesByBread(moves);
				
				var valid = false;
				for (var i = 0; i < moves.length; i++){
					if ( moves[i][0] == targetx && moves[i][1] == targety ){ valid = true; break; }
				}
				if (!valid){ return; }
				
				// successful piece move
				
				// any king move removes castling rights (including castling itself)
				var piecetype  = g.board[startx][starty].charAt(1);
				if (piecetype == "k"){ 
					g.castlingrights[g.players.indexOf(p.id)] = [false,false]; 
					
					// if castling, move the rook too
					// (kingside)
					if ((targetx - startx) == 2){
						g.board[startx + 1][starty] = g.board[startx + 3][starty];
						g.board[startx + 3][starty] = null;
					}			
					// (queenside)
					if ((targetx - startx) == -2){
						g.board[startx - 1][starty] = g.board[startx - 4][starty];
						g.board[startx - 4][starty] = null;
					}
				}
				
				// Removes castling rights if rooks have moved or been captured
				if ((targetx == 7 && targety == 0) || (startx == 7 && starty == 0)){
					g.castlingrights[0][0] = false; console.log("white cant castle kingside anymore");
				}
				if ((targetx == 0 && targety == 0) || (startx == 0 && starty == 0)){
					g.castlingrights[0][1] = false; console.log("white cant castle queenside anymore");
				}
				if ((targetx == 7 && targety == 7) || (startx == 7 && starty == 7)){
					g.castlingrights[1][0] = false; console.log("black cant castle kingside anymore");
				}
				if ((targetx == 0 && targety == 7) || (startx == 0 && starty == 7)){
					g.castlingrights[1][1] = false; console.log("black cant castle queenside anymore");
				}
				
				var movename = g.getMoveName(startx, starty, targetx, targety);
				
				var gameovertype = false;
				var targetpiece = g.pieceAt(targetx,targety);
				var winnerindex;
				
				// here is where we decide if a move ends the game
				if (targetpiece){
					var targetpiececolor = targetpiece.charAt(0);
					
					if (targetpiece.charAt(1) == "k"){
						movename += "#";
						winnerindex = targetpiececolor == "b" ? 0 : 1;
						gameovertype = "checkmate";
					}
				}
				
				g.turn = (g.turn + 1) % 2;
				g.board[targetx][targety] = g.board[startx][starty];
				g.board[startx][starty] = null;
				io.to(g.id).emit("boardUpdate", g.board);
				io.to(g.id).emit("pieceMoved", [startx,starty], [targetx, targety], movename);
				
				if (gameovertype){
					g.end(gameovertype, winnerindex);
				}else{
				// if the game is still going on, we roll the bread for the next players turn
					g.bread = g.rollUntilLegal();
					var legalsquares = g.getLegalSquaresByBread(g.bread);
					io.to(g.id).emit("breadRoll", g.bread, legalsquares);
				}
			});
			
			socket.on("disconnect", function () {
				var playerLeaving = gameserver.getPlayerFromSocket(this);
				if (playerLeaving == -1){ return; };
				
				// player forcibly loses if they leave
				if (playerLeaving.currentgame){
					var g = gameserver.games[playerLeaving.currentgame];
					var loserindex = g.players.indexOf(playerLeaving.id);
					var winnerindex = (loserindex + 1)%2;
					
					g.end("abandon",winnerindex);
				}
				
				gameserver.onPlayerLeave(playerLeaving);
				
			});
		
		});
		
		setInterval(()=> { this.update() }, 1000 / config.TICKS_PER_SECOND);
	}
	
	update(){
		
	}
	
	getPlayerFromSocket(socket_in){
		for (var i in this.players){
			if (socket_in.id == this.players[i].socket) {
				return this.players[i];
			}
		}
		return null;
	}
	
	onPlayerLeave( p ){
		var ind = p.id;
		console.log( p.name + " has left the server (ID: " + ind + ")")
		delete this.players[p.id];

		io.emit("playerLeave", ind, this.players);
		
		// todo: check all games for that player id, and if the player is in a game then automatically resign them
		// or in the future, store a cookie with their id so they can rejoin within a limited amount of time
	}
}

gameserver = new GameServer(); gameserver.init();