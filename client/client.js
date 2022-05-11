class Client {
	// local state of game to be displayed to the users
	constructor(){
		this.board = [[],[],[],[],[],[],[],[]];
		this.playerw = null; this.playerb = null;
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
			
			this.on("playerJoin", function(playerJoining){
				if (!client.connected){
					client.connected = true;
					
					playerJoining.socket = this.id;
					//player.name   = my_nama
					this.emit("playerAddSocket", playerJoining.id, this.id);
					
				}
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
	
	// piece drawing
	for (var y = 0; y < 8; y++){
		var sy = y * (height/8);
		for (var x = 0; x < 8; x++){
			var sx = x * (width/8);
			if (client.board[x][y]){
				image(PIECE_TEXTURES[ client.board[x][y] ], sx, sy, width/8, height/8 );
			}
		}
	}
}