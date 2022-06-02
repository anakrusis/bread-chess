var socket;

function setup(){
	var dim = 720;
	// height and width should always be equal otherwise shenanigans will occur
	createCanvas(dim, dim);
	frameRate(60);
	textAlign(CENTER, CENTER);
	textStyle(BOLDITALIC);
	textSize(40);
	
	client = new Client(); client.init();	
	document.getElementById("queueup").onclick = function(){
		client.serverConnect("http://localhost:16160");
		client.centertext = "Connecting...";
	}
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
	// TODO bake transparency into a GHOST_TEXTURES table?
	// (dreadfully slow in real time it seems)
}

function mousePressed(e){
	//e.preventDefault();
	var sx = client.screenToCoordX(mouseX); var sy = client.screenToCoordY(mouseY);
	
	if (sx < 0 || sx > 7 || sy < 0 || sy > 7){ return; }
	console.log(sx + " " + sy);
	client.mousestartx = sx; client.mousestarty = sy;
	
	if (client.board[sx][sy]){ // will drag piece if a piece is present, otherwise remains null
		client.pieceDraggedX = sx; client.pieceDraggedY = sy;
	}
}

function mouseReleased(e){
	//e.preventDefault();
	var sx = client.screenToCoordX(mouseX); var sy = client.screenToCoordY(mouseY);
	if (sx < 0 || sx > 7 || sy < 0 || sy > 7){ return; }
	
/* 	// if a piece is already selected...
	if (client.pieceSelectedX != null){
		// clicking and releasing on that same square should unselect it
		if (sx == client.pieceSelectedX && sy == client.pieceSelectedY){
			client.pieceSelectedX = null; client.pieceSelectedY = null;
			client.validmoves = [];
		}
	}
	 */
	
	// if dragged to a new square, send a request
	if ((sx != client.pieceDraggedX) || (sy != client.pieceDraggedY )){
		if (client.pieceDraggedX != null){ 	// gotta make sure it's not null
			socket.emit("pieceMoveRequest", client.pieceDraggedX, client.pieceDraggedY, sx, sy);
			client.pieceSelectedX = null; client.pieceSelectedY = null;
			client.validmoves = [];
			
		}else{
			if (client.pieceSelectedX != null){
				socket.emit("pieceMoveRequest", client.pieceSelectedX, client.pieceSelectedY, sx, sy);
			}
			client.pieceSelectedX = null; client.pieceSelectedY = null;
			client.validmoves = [];
		}
	}else{
		// if clicked and released on the same square, and there's a piece, then select the piece
		// because selecting the piece will display dots on all the valid squares, we request this info
		if (client.pieceDraggedX != null){ 
			client.pieceSelectedX = sx; client.pieceSelectedY = sy;
			socket.emit("validMovesRequest", client.pieceDraggedX, client.pieceDraggedY);
			
		// if click and release, and no piece, then unselect whatever piece was selected before
		}else{
			client.pieceSelectedX = null; client.pieceSelectedY = null;
			client.validmoves = [];
		}
	}
	client.pieceDraggedX = null; client.pieceDraggedY = null;
}

function draw(){	
	// the checkered background
	noStroke();
	for (var i = 0; i < 8; i++){
		var sx = i * (width/8);
		
		for (var j = 0; j < 8; j++){
			var sy = j * (height/8);
			
			if (( i + j ) % 2 == 1){
				//fill("#B58863");
				fill("#992222");
			}else{
				//fill("#F0D9B5");
				fill("#aa2222");
			}
			rect(sx,sy,width/8,height/8);
		}
	}
	// todo tiny coordinate letters above the squares
	
	// piece drawing
	for (var y = 0; y < 8; y++){	
		var sy = client.coordToScreenY( y );
		for (var x = 0; x < 8; x++){
			var sx = client.coordToScreenX( x );
			if (client.board[x][y]){
				
				// if the piece is being dragged then it will skip every other frame for fake transparency
				if (client.pieceDraggedX == x && client.pieceDraggedY == y && frameCount % 2 == 0){
					continue;
				}
				
				image(PIECE_TEXTURES[ client.board[x][y] ], sx, sy, width/8, height/8 );
			}
		}
	}
	
	// valid move indicator dots
	for (var i = 0; i < client.validmoves.length; i++){
		var cm = client.validmoves[i];
		var mx = client.coordToScreenX( cm[0] ); 
		var my = client.coordToScreenY( cm[1] );
		
		fill(0,160,0,90)
		circle(mx + width/16,my + width/16,width/28);
	}
	
	// dragging indicator square
	if (client.pieceDraggedX != null){
		fill(0,160,0,90)
		var dx = client.coordToScreenX( client.pieceDraggedX );
		var dy = client.coordToScreenY( client.pieceDraggedY );
		rect(dx,dy,width/8,height/8);
	}
	
	//ghost piece
	if (client.pieceDraggedX != null){
		var piece = client.board[client.pieceDraggedX][client.pieceDraggedY];
		image(PIECE_TEXTURES[piece], mouseX - width/16, mouseY - height/16, width/8, height/8);
	}
	
	if (client.centertext != ""){
		strokeWeight(6)
		stroke(0);
		fill(255);
		text(client.centertext, width/2, height/2 - height/16);
	}
}