// JavaScript Document
//socket.io has 2 parts: serverside that mounts on the node.js http server AND the client library that loads on teh broswer side
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http); //define your io or everything will break and you will hate yourself for hours
var now = (function () {
		   var year = new Date(new Date().getFullYear().toString()).getTime();
			return function(){
				return Date.now() - year;
			};
		   })();

var totalUsers = []; //generate an array to keep track of members; every user is just pushed in as it's own object \
var chatLog = [];


function registerUser(socketID){	 //dont worry about cookies and shit 

	console.log(socketID);
	 
	//this function SHOULD ONLY BE CALLED ONCE per client connect
 	//generate a random nickname when the user first navigates to the server; check if they already exist first 
	var generated = Math.random().toString(36).substring(7); //generated username 
				
	var user= { //the object array that gets shoved into the actual total members array 
		id: generated, //the user id starts with the generated nickname and never changes 
		userNickname: generated, //the nickname can change based on user preference 
		userSocketID: socketID
	}; 
	totalUsers.push(user); //now shove the user object into the array 
	console.log('user pushed');
	return (user);
}


function changeUserNickname(value){
	for (var i=0; i<totalUsers.length; i++) {
		if (totalUsers[i].userNickname === value) {
			console.log('keymatch');
			return totalUsers[i];
		}
		else{
			totalUsers[i].userNickname = value; //CHANGE the key value 
			return totalUsers[i]; //i really should map out these functions before i start coding and it would make my life a lot easier 
		}
	}
}


function checkColor(message){
	var nickColor = message.search('/nickcolor');
	
	if (nickColor == 0) {
		console.log(nickColor);
		var nickColor = message.slice(11, (message.length ));
		return nickColor;
		
	}
	
}

function checkNick(message){
		var nick = message.search('/nick');
	if (nick === 0){
		var leftBound = message.search('<');
		var rightBound = message.search('>');
		
		console.log(nick);
		var nickname = message.slice((leftBound + 1), rightBound);
		return nickname; 
	}
}


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
	//so far we call res.sendFile and then send index to the server 
});

io.on('connection', function(socket){ //on connect 
	
	//set nickname event 
	socket.on('register user', function(socketID){ //only gets tripped when the user comes on for the first time DOESNT HAVE COOKIES 		
		
		
		for (var i=0; i < totalUsers.length; i++){ //check if user exists already
			if (totalUsers[i].userSocketID === socketID){
				console.log("don't register a user");
				//user already exists, push back the full user profile 
				socket.emit('ready', totalUsers[i]);
				socket.emit('total users', totalUsers);
				break; //out of for loop; user already exist	
			}
			console.log("no match, user doesn't exist yet");
		}
		
		//for loop searches whole array and doesn't find any match
		var tempUser = registerUser(socket.id); 
		socket.emit('ready', (tempUser)); //push the whole user back ?
	
		socket.emit('total users', totalUsers);
	});
	
	

	socket.on('set nickname', function(nickname){
		var tempUser = changeUserNickname(nickname);	
		socket.emit('ready', (tempUser));
	});
	
	
	//chat message event 
	socket.on('chat message', function(msg){	
		var nickname = checkNick(msg);
		var color = checkColor(msg);
		
		if (color){ //if it has /nickcolor, catch it or it will also trip /nick 
			color = '#' + color;
			socket.emit('change color', color);
		}
		else if (nickname){ //only executes if false 
			var tempUser = changeUserNickname(nickname);
			socket.emit('ready', (tempUser));
		}
		else{ //normal message, dont record /nick or /nickcolor in chatlog 
			var tempMessage = {
			user: nickname,
			message: msg,
			timestamp: Date(now())
		};
			
			chatLog.push(tempMessage);
			console.log(tempMessage);
		
		
			io.emit('chat message', tempMessage); //io.emit sends an event to everyone
		}
		

	});
	
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});
    //so far we call res.send and pass an html string 