// Chess server

var config = require('./config.js');
var game = require('./game.js');

class Player {
	constructor(id){
		this.id = Math.round(Math.random() * 100000);
		this.name = "Player" + this.id;
		this.type = this.constructor.name;
	}
}

class GameServer {
	
	constructor(){
		
		// List of valid moves for every type of piece, accessed by the piecetype string. 
		// These valid moves will be mirrored in all four directions
		// another copy of this will be stored clientside, but only for the sole purpose of rendering.
		// (The server is still the only one who can dictate a valid move in gameplay)
		this.MOVESET = {
			
			"bishop": [[1,1],[2,2],[3,3],[4,4],[5,5],[6,6],[7,7],[8,8]],
			"king"  : [[1,1],[0,1]],
			"knight": [[2,1],[1,2]],
			"pawn"  : [[0,1]],
			"queen" : [[1,1],[2,2],[3,3],[4,4],[5,5],[6,6],[7,7],[8,8],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0]],
			"rook"  : [[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0]],
		}
		
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
					
				// TODO: list all games and player names
				case "/list":
					break;
			}
		});
		
		const { Server } = require("socket.io");

		this.io = new Server(config.PORT, { 
			cors: {
				origin: "http://127.0.0.1:8887",
				allowedHeaders: ["my-custom-header"],
				credentials: true
			} 
		});
		this.io.on('connection', function (socket) {
			
			if (Object.keys(gameserver.players).length >= gameserver.MAX_PLAYERS){ return; }
	
			var playerJoining = new Player();
			
			this.emit("playerJoin", playerJoining, gameserver.players, gameserver.pieces);
			
			socket.on("playerAddSocketAndName", function (playerid, socketid, nama) {
						
				gameserver.players[playerJoining.id] = playerJoining;				
				gameserver.players[playerid].socket = socketid;			
				console.log(playerJoining.name + " has joined the server (ID: " + playerJoining.id + ")" )
				
				// here is where we will matchmake the player to a game
				for (var i = 0; i < this.games.length; i++){
					var g = this.games[i];
					
					// if there is an empty game then randomly assign the first player to either black or white
					if (!g.playerw && !g.playerb){
					
					}else{
						
					}
				}
				// if there is no games available then make a new game
				
				//server.io.emit("playerJoin", playerJoining, server.players, server.pieces);
				
				//server.spawnPlayer ( playerJoining );
				
			});
			
			// when a player tries to move a piece
			socket.on("pieceMoveRequest", function(pieceuuid, targetx, targety){
				
				var originalx = server.pieces[pieceuuid].x;
				var originaly = server.pieces[pieceuuid].y;
				
				var playerMoving = server.getPlayerFromSocket(this);
				var pieceMoving  = server.pieces[pieceuuid];
				
				if (pieceMoving.playerUUID != playerMoving.id){ return; }
				
				var moves = server.MOVESET[ pieceMoving.piecetype ]; 
				var validSpaces = server.getValidSpaces(pieceMoving, moves); 
				
				var valid = false;
				for (var i = 0; i < validSpaces.length; i++){
					if ( validSpaces[i][0] == targetx && validSpaces[i][1] == targety ){ valid = true; break; }
				}
				if (!valid){ return; }
				
				var p = server.getPiece(targetx, targety);
				if (p){
					delete server.pieces[p.uuid];
				}

				pieceMoving.x = targetx;
				pieceMoving.y = targety;
				
				server.io.emit("boardUpdate", server.pieces);
				server.io.emit("pieceMoved", playerMoving.id, pieceuuid, originalx, originaly, targetx, targety );
				
			});
			
			socket.on("disconnect", function () {

				var playerLeaving = server.getPlayerFromSocket(this);
				 
				if (playerLeaving == -1){ return; };
				
				server.onPlayerLeave(playerLeaving);
			});
		
		});
		
		setInterval(()=> { this.update() }, 1000 / config.TICKS_PER_SECOND);
	}
	
	update(){
		
	}
	
	getValidSpaces( piece, moves ){
		
		var output = [];
		
		for ( var angle = 0; angle < Math.PI * 2; angle += Math.PI/2 ){
			for (var i = 0; i < moves.length; i++){
				
				// Lololol this is trig to rotate the moves in all four directions
				var mx = Math.round((moves[i][0]) * Math.cos(angle) - (moves[i][1]) * Math.sin(angle));
				var my = Math.round((moves[i][0]) * Math.sin(angle) + (moves[i][1]) * Math.cos(angle));
				
				var xcoeff = Math.sign(mx); var ycoeff = Math.sign(my);
				
				//if ( this.isTileOccupied( piece.x + mx, piece.y + my ) ){ continue; }
				var p = this.getPiece(piece.x + mx, piece.y + my);
				if (p){
					if (p.playerUUID == piece.playerUUID){
						continue;
					}
				}
				
				// Knights can hop over other pieces so they need not check for obstructions
				if (piece.piecetype == "knight"){ output.push([ piece.x + mx , piece.y + my ]); continue; }
				
				// This loop checks for pieces between the current space and the target space
				var obstructed = false;
				var currentx = piece.x; var currenty = piece.y;
				var count = 0;
				while ( currentx != piece.x + mx || currenty != piece.y + my ){
					
					currentx += xcoeff; currenty += ycoeff;
					
					var p = this.getPiece( currentx, currenty );
					if (p){
						if (p.playerUUID != piece.playerUUID){
							output.push([ currentx , currenty ]);
						}
						obstructed = true; break;
					}
					
					// There is no reason for any piece to move 15 spaces out
					// It's just a preventative measure in case the loop might get stuck infinitely going out
					count++; if (count > 15){ break; }
				}
				
				if (obstructed){ continue; }
				
				output.push([ piece.x + mx , piece.y + my ]);
			}
		}
		
		return output;
	}
	
	spawnPiece( piece ){
		this.pieces[piece.uuid] = piece;
		this.io.emit("boardUpdate", this.pieces);
	}
	
	getPlayerFromSocket(socket_in){
		for (var i in this.players){
			if (socket_in.id == this.players[i].socket) {
				return this.players[i];
			}
		}
		return -1;
	}
	
	onPlayerLeave( p ){
		var ind = p.id;
		console.log( p.name + " has left the server (ID: " + ind + ")")
		delete this.players[p.id];

		this.io.emit("playerLeave", ind, this.players);
	}
}

var gameserver = new GameServer(); gameserver.init();