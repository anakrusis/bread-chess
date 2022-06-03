class Client {
	// local state of game to be displayed to the users
	constructor(){
		this.board = [[],[],[],[],[],[],[],[]];
		this.boardhistory = [];
		this.movenames = [];
		
		this.players = [];
		this.playerid = null;
		this.connected = false;
		this.pieceSelectedX = null; this.pieceSelectedY = null;
		this.pieceDraggedX = null; this.pieceDraggedY = null;
		this.validmoves = []; // just for display purposes
		
		this.mousestartx = null; this.mousestarty = null;
		
		this.centertext = "Welcome to Bread Chess!";
		this.nextcell = null; // cell in the moves table to be updated next
	}

	init(){
		// clears list of moves
		this.board = [[],[],[],[],[],[],[],[]];
		this.boardhistory = [];
		this.movenames = [];
		var movetable = document.getElementById("movestable");
		movetable.innerHTML = "";
	}
	
	serverConnect(ip){
		socket = io.connect(ip, { 
			reconnection: false,  withCredentials: true,
			extraHeaders: {
				"my-custom-header": "abcd"
			} 
		});
		
		socket.on("connect", function(){	
			// the queue up button can hide now
			document.getElementById("queueup").style.display = "none";
			client.centertext = "Waiting for another player...";
			
			client.init();
			
			this.on("disconnect", function(){
				this.disconnect();
				this.connected = false;
				
				document.getElementById("queueup").style.display = "block";
			});
			
			// this id provided will stay clientside for the whole session
			this.on("playerJoin", function( playerid ){
				client.playerid = playerid;
				console.log(playerid + " has joined ");
				
				// now that the player object exists, if there is a name already written in the text box, we will send a request to add it immediately
				var nametext = document.getElementById("namebottom").value;
				if (nametext != ""){
					console.log("nametext: " + nametext);
					this.emit("nameChangeRequest", nametext);
				}
				// we will also setup the event that listens for name changes
				document.getElementById("namebottom").addEventListener("input", function(e){
					
					socket.emit("nameChangeRequest", e.target.value);
				});
			});
			this.on("gameStart", function( players ){
				client.players = players;
				client.centertext = "";
			});
			
			this.on("nameUpdate", function(names){
				// the displayed names at the top and bottom are added in at the start of the match
				var upperjaw = document.getElementById("nametop");
				var lowerjaw = document.getElementById("namebottom");
				
				if (client.playerid == client.players[0]){
					upperjaw.textContent = names[1];
					lowerjaw.value = names[0];
				}else{
					upperjaw.textContent = names[0];
					lowerjaw.value = names[1];	
				}
			});
			
			this.on("boardUpdate", function(board){
				// no deep copying is needed because a brand new array comes from the server
				client.boardhistory.push( client.board );
				client.board = board;
			});
			
			this.on("pieceMoved", function(startpos,endpos,movename){
				var movetable = document.getElementById("movestable");
				
				client.movenames.push( movename );
				// on every odd move, make a new row in the table
				if (client.movenames.length % 2 == 1){
					
					var newrow = movetable.insertRow();
					var headercell = document.createElement('th');
					headercell.innerHTML = (client.movenames.length + 1) / 2;
					newrow.appendChild(headercell);
					
					var cell1 = newrow.insertCell();
					cell1.innerHTML = '<button type="button" class="button1">' + movename + '</button>'
					
					var cell2 = newrow.insertCell();
					cell2.innerHtml = " ";
					client.nextcell = cell2;
					
				// on every even move, fill in the other blank cell in the row
				}else{
					client.nextcell.innerHTML = '<button type="button" class="button1">' + movename + '</button>'
				}
			});
			
			this.on("validMoves", function(moves){
				client.validmoves = moves;
			});
			
			this.on("breadRoll", function(bread){
				console.log("bread rolled " + bread[0] + " " + bread[1]);
				client.bread = bread;
				// todo animation timer for the bread
				
				var padding = document.getElementById("padding1");
				padding.innerHTML = "";
				for (var i = 0; i < bread.length; i++){
					if (parseInt(bread[i])){
						padding.innerHTML += "🍞".repeat(bread[i]) + "<br>";
					}
				}
				// game coordinates
				var alphabet = ["a","b","c","d","e","f","g","h"];
				var coordstring1 = ""; var coordstring2 = "";
				if (parseInt(bread[0])){
					coordstring1 = alphabet[bread[0] - 1];
					coordstring2 = alphabet[bread[0] - 1];
				}else{
					coordstring1 = "*"; coordstring2 = "*";
				}
				if (parseInt(bread[1])){
					coordstring1 += "" + bread[1];
					coordstring2 += "" + Math.abs(9 - bread[1]);
				}else{
					coordstring1 += "*"; coordstring2 += "*";
				}
				padding.innerHTML += coordstring1 + "/" + coordstring2;
				
				padding.innerHTML = "<h1>" + padding.innerHTML + "</h1>";
			});
			
			this.on("gameEnd", function( endingtype, winnerindex ){
				console.log(endingtype + ", " + winnerindex);
				var padding = document.getElementById("padding1");
				
				var victorystring1 = ""; var victorystring2 = "";
				victorystring1 += winnerindex == 0 ? 1 : 0;
				victorystring1 += "-";
				victorystring1 += winnerindex == 1 ? 1 : 0;
				victorystring1 = "<h1>" + victorystring1 + "</h1>";
				
				victorystring2 += winnerindex == 0 ? "White" : "Black";
				victorystring2 += " is victorious";
				victorystring2 = "<h3>" + victorystring2 + "</h3>";
				
				padding.innerHTML = victorystring1 + "<br>" + victorystring2;
			});
		});
	}
	
	// Todo place screen coords-to-board coords and vice versa into utility functions here
	// (or anywhere really)
	coordToScreenX(cx){
		if (client.playerid == client.players[1]){
			var sx = (7 - cx) * (width/8);
		}else{
			var sx = cx * (width/8);
		}
		return sx;
	}
	coordToScreenY(cy){
		var sy;
		// if player has black pieces, then render normally (top to bottom, low coords to high)
		if (client.playerid == client.players[1]){
			sy = cy * (height/8);
		// and if white pieces, flip em
		}else{
			sy = (7 - cy) * (height/8);
		}
		return sy;
	}
	screenToCoordX(sx){
		var cx;
		// x is flipped with the black pieces as usual
		if (client.playerid == client.players[1]){
			cx = Math.floor( 8 - ( sx / ( width / 8 )) );
		}else{
			cx = Math.floor(sx / ( width / 8 ));
		}
		return cx;
	}
	screenToCoordY(sy){
		var cy;
		// y is flipped with the white pieces as usual
		if (client.playerid == client.players[0]){
			cy = Math.floor( 8 - ( sy / ( height / 8 )) );
		}else{
			cy = Math.floor( sy / ( height / 8 ));
		}
		return cy;
	}
}