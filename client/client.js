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