class Client {
	// local state of game to be displayed to the users
	constructor(){
		this.board = [[],[],[],[],[],[],[],[]];
		this.players = [];
		this.playerid = null;
		this.connected = false;
	}

	init(){
		this.serverConnect("http://localhost:16160");
	}
	
	serverConnect(ip){
		this.socket = io.connect(ip, { 
			reconnection: false,  withCredentials: true,
			extraHeaders: {
				"my-custom-header": "abcd"
			} 
		});
		
		this.socket.on("connect", function(){
			
			this.on("disconnect", function(){
				this.disconnect();
				this.connected = false;
			});
			
			this.on("playerJoin", function( playerid ){
				client.playerid = playerid;
				console.log(playerid + " has joined ");
			});
			this.on("gameStart", function( players, names ){
				client.players = players;
				
				// the displayed names at the top and bottom are added in at the start of the match
				var upperjaw = document.getElementById("nametop");
				var lowerjaw = document.getElementById("namebottom");
				
				if (client.playerid == players[0]){
					upperjaw.textContent = names[1];
					lowerjaw.value = names[0];
				}else{
					upperjaw.textContent = names[0];
					lowerjaw.value = names[1];	
				}
				// player can freely edit their display name during the match
				lowerjaw.contentEditable = true;
			});
			
			this.on("boardUpdate", function(board){
				console.log("updating board");
				client.board = board;
			});
		});
	}
}

function setup(){
	var dim = 600;
	// height and width should always be equal otherwise shenanigans will occur
	createCanvas(dim, dim);
	frameRate(60);
	
	client = new Client(); client.init();
}

function preload(){
	PIECE_TEXTURES = {
		"wk": loadImage("assets/piece/wK.svg"),
		"wq": loadImage("assets/piece/wQ.svg"),
		"wr": loadImage("assets/piece/wR.svg"),
		"wb": loadImage("assets/piece/wB.svg"),
		"wn": loadImage("assets/piece/wN.svg"),
		"wp": loadImage("assets/piece/wP.svg"),
		
		"bk": loadImage("assets/piece/bK.svg"),
		"bq": loadImage("assets/piece/bQ.svg"),
		"br": loadImage("assets/piece/bR.svg"),
		"bb": loadImage("assets/piece/bB.svg"),
		"bn": loadImage("assets/piece/bN.svg"),
		"bp": loadImage("assets/piece/bP.svg"),
	}
}

function draw(){
	// the checkered background
	noStroke();
	for (var i = 0; i < 8; i++){
		var sx = i * (width/8);
		
		for (var j = 0; j < 8; j++){
			var sy = j * (height/8);
			
			if (( i + j ) % 2 == 1){
				fill("#B58863");
			}else{
				fill("#F0D9B5");
			}
			rect(sx,sy,width/8,height/8);
		}
	}
	// todo tiny coordinate letters above the squares
	
	// piece drawing
	for (var y = 0; y < 8; y++){	
		// if player has black pieces, then render normally (top to bottom, low coords to high)
		if (client.playerid == client.players[1]){
			var sy = y * (height/8);
		// with white pieces, flip
		}else{
			var sy = (7 - y) * (height/8);
		}
		
		for (var x = 0; x < 8; x++){
			// likewise, but this time, if player has black pieces, horizontally flip
			if (client.playerid == client.players[1]){
				var sx = (7 - x) * (width/8);
			}else{
				var sx = x * (width/8);
			}
			
			if (client.board[x][y]){
				image(PIECE_TEXTURES[ client.board[x][y] ], sx, sy, width/8, height/8 );
			}
		}
	}
}