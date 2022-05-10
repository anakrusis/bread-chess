class Client {
	// local state of game to be displayed to the users
	constructor(){
		this.board = [];
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
		});
	}
}

function setup(){	
	createCanvas(640, 640);
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