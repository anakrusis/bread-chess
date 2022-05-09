class Client {
	
	constructor(){
		
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
				client.player = null;
			});
		});
	}
}

function setup(){	
	createCanvas(640, 640);
	frameRate(60);
	
	client = new Client(); client.init();
}