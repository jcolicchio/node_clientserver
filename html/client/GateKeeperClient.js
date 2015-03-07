// This file is pretty much boilerplate, users should ideally never need to tweak it

// This file contains code for connecting to gatekeeper
// When you ask to connect, you pass it a method to call with the approriate server info
// for when you want to connect to a game server
// Presently, it passes in a ServerInfo object

// TODO: list of all players connected
// TODO: refresh mechanic needs to be fleshed out


// TODO: login/sign up/register ui elements
// TODO: check cookies for auth token
	// on start, if cookie found, when connecting immediately try to auth for the user
	// if the token is valid, pull their user?
	// hell, just do a GetUser with the cookie'd token
	// add login/signup ui options to start
	// those should dynamically show fields for registration/login
	// when using those, we call gk.private.gateKeeper.send("Register", {email, hash})
	// make sure to use MD5 on the password field before submitting
	


var GateKeeperInfo = this['GateKeeperInfo'];
var Protocol = this['Protocol'];

var AES = this['AES'];

var gamesList = ["Chat", "Game", "DiceWars"];
var makeNavBar = function(list, signedIn) {
	var nav = $("<nav id='nav'>/</nav>");
	for(key in list) {
		var value = list[key];
		nav.append(" <a href='/custom/"+value.toLowerCase()+"/'>"+value+"</a> /");
	}
	if(signedIn) {
		nav.append(" <a href='/profile.html'>Profile</a> /");
		nav.append(" <input id='logout' type='submit' value='Log Out' /> /");
	} else {
		nav.append(" <input id='showlogin' type='submit' value='Log In/Register' /> /");
	}
	return nav;
}
var updateNavBar = function(signedIn) {
	$('#nav').remove();
	$('body').prepend(makeNavBar(gamesList, signedIn));
}
$(document).ready(function() {
	updateNavBar(false);
	$('body').on('click', '#showlogin', function() {
		// show login stuff
		var loginArea = $('#loginarea');
		if(loginArea.length > 0) {
			loginArea.remove();
		} else {
			$('#nav').append("<div id='loginarea'>Email:<input id='email' name='email' type='text'/><br/>"+
			"Password:<input id='password' name='password' type='password' /><br/>"+
			"<input type='submit' id='login' value='Log In' /> <input type='submit' value='Register' id='register' /></div>");
		}
	});
	$('body').on('click', '#login', function() {
		// actually log in
		var email = $('#email').val();
		var hash = CryptoJS.MD5($('#password').val()).toString();
		gk.private.login(email, hash);
	});
	$('body').on('click', '#register', function() {
		// actually log in
		var email = $('#email').val();
		var hash = CryptoJS.MD5($('#password').val()).toString();
		gk.private.register(email, hash);
	});
	$('body').on('click', '#logout', function() {
		gk.private.logout(gk.private.token);
	});
});

// var gk = GateKeeperClient();
// gk.typeFilter = "Dicewars";
// gk.server.onopen = function() { gk.server.send("message", "i joined!"); };

var getCookie = function(token){
	var cookie = document.cookie;
	var index = cookie.indexOf(token);
	if(index == -1) { return null; }
	var start = cookie.substring(index+token.length+1);
	index = start.indexOf(";");
	if(index == -1) { return start; }
	return start.substring(0, index);
};
var setCookie = function(token, value) {
	document.cookie = token+"="+value+"; path=/";
}
var AUTH = "authToken";


var GateKeeperClient = function() {
	var gk = {
		typeFilter: null, // optional filter for gate keeper UI to use
		server: {
			connected: false, // connection is live
			authenticated: false, // connection has been auth'd, we're legit

			onopen: null, // to be called once a connection has been established and the user has authed to server
			onclose: null, // to be called when the connection to the server is terminated?
			onmessage: null, // to be called whenever the server has a message for the client
			onerror: null, // to be called when there's some kind of client-server error

			send: function(key, payload) {
				gk.private.server.send(JSON.stringify(Protocol.new(key, payload)));
			},
			close: function() {
				gk.private.server.close();
			}
		},

		private: {
			gateKeeper: null,
			connected: false,
			user: null,
			authenticated: false,
			token: null,
			login: function(email, hash) {
				gk.private.gateKeeper.send(JSON.stringify(Protocol.new("Login", {email:email,hash:hash})));
			},
			register: function(email, hash) {
				gk.private.gateKeeper.send(JSON.stringify(Protocol.new("Register", {email:email,hash:hash})));
			},
			getUser: function(token) {
				gk.private.gateKeeper.send(JSON.stringify(Protocol.new("GetUser", token)));
			},
			setUser: function(token, user) {
				gk.private.gateKeeper.send(JSON.stringify(Protocol.new("SetUser", {token:token,user:user})));
			},
			logout: function(token) {
				gk.private.gateKeeper.send(JSON.stringify(Protocol.new("Logout", token)));
			},
			validate: function(token) {
				gk.private.gateKeeper.send(JSON.stringify(Protocol.new("Validate", token)));
			},
			updatePassword: function(token, currentHash, newHash) {
				gk.private.gateKeeper.send(JSON.stringify(Protocol.new("UpdatePassword", {token:token,currentHash:currentHash,newHash:newHash})));
			},
			servers: [],
			server: null,

			serverList: null,
			requestServerList: function() {
				gk.private.gateKeeper.send(JSON.stringify(Protocol.new("ServerList", null)));
			},
			generateServerListElements: function(serverItems) {
				var serverList = $("<div id='serverlist'></div>");

				var refresh = $("<input class='refresh' type='submit' value='Refresh' />");
				refresh.on('click', function(e) {
					gk.private.requestServerList();
					// TODO: disable the refresh, and continually update some UI element or give callbacks or something
					// when we receive a "done refreshing", consider re-enabling?
					// this is all getting into non-standard territory
					// TODO: figure out some kind of way a server can get a stream of live servers like how TF2 do
					// and if we could define some kind of callback a player can set
					// or better yet, have serverList update itself as servers show up, that'd be sweet
				});

				serverList.append("Servers: ").append(refresh).append("<br/>");

				for(key in serverItems) {
					if(!gk.typeFilter || serverItems[key].type == gk.typeFilter) {
						var s = serverItems[key];
						var button = $("<input type='submit' value='Join' class='join' />");
						button.data("info", s);

						button.on('click', function(e) {
							// make a new socket, hide the UI, call whatever callback we've had the user set up
							gk.private.joinServer($(this).data("info"));
						});

						serverList.append(s.name+": "+s.ip+":"+s.port+", "+s.players+"/"+s.capacity+" ").append(button).append("<br/>");
					}
				}

				return serverList;
			},
			joinServer: function(serverInfo) {
				gk.private.server = new WebSocket("ws://"+serverInfo.serverString());
				// hide the ui, and show it again 
				
				gk.private.server.onopen = function() {
					// gk has connected our client to our server, and will now handle some cruft
					// TODO: login/auth cruft
					// when gk has verified for us that both parties are happy, it'll call gk.onopen
					gk.server.connected = true;

					// when auth happens:
					// TODO: if(gk.server.onopen) { gk.server.onopen(); }
					gk.server.send("auth", "this is an auth request");

					if(gk.private.serverList) {
						gk.private.serverList.remove();
						gk.private.serverList = null;
					}
				}

				gk.private.server.onclose = function() {
					// disconnect cruft, call onclose, re-add server list/refresh or whatever
					gk.server.connected = false;
					if(gk.server.authenticated) {
						gk.server.authenticated = false;
						if(gk.server.onclose) {
							gk.server.onclose();
						}
					}

					// ask GK for another server list?
					gk.private.requestServerList();
				}

				gk.private.server.onmessage = function(event) {
					var protocol = Protocol.import(event.data);

					if(gk.server.connected && gk.server.authenticated) {
						// forward to client
						if(gk.server.onmessage) {
							gk.server.onmessage(protocol.key, protocol.payload);
						}
					} else if(protocol.key == "auth") {
						// intercept auth, do stuff
						gk.server.authenticated = true;
						// since we've authed, let the user know he's connected?
						if(gk.server.onopen) {
							gk.server.onopen();
						}

					} else if(protocol.key == "password") {
						var pw = prompt("What is the password?");
						var cleartext = "";
						try {
							cleartext = AES.decrypt(protocol.payload, pw);
						} catch (e) {
							cleartext = "";
						}
						gk.server.send("password", cleartext);
					}
				}

				gk.private.server.onerror = function() {
					if(gk.server.onerror) {
						gk.server.onerror();
					}
				}
			}
		},
		connect: function() {
			this.private.gateKeeper = new WebSocket("ws://"+window.location.hostname+":"+GateKeeperInfo.clientPort);
			this.private.gateKeeper.onopen = function() {
				console.log("Connection to GK opened");
				gk.connected = true;

				// check for token
				var token = getCookie(AUTH);
				if(token) {
					console.log("got token, try it!: "+token);
					//we have token, send and try to authenticate
					gk.private.validate(token);
					gk.private.token = token;
				}
			}
			this.private.gateKeeper.onclose = function() {
				console.log("Connection to GK closed");
				gk.connected = false;
			}
			this.private.gateKeeper.onerror = function() {
				console.error("Connection error");
			}
			this.private.gateKeeper.onmessage = function(event) {
				var protocol = Protocol.import(event.data);

				if(protocol.key == "ServerList") {

					gk.private.servers = protocol.payload;

					if(!gk.server.connected) {
						if(gk.private.serverList) {
							gk.private.serverList.remove();
						}
						gk.private.serverList = gk.private.generateServerListElements(gk.private.servers);

						$('body').append(gk.private.serverList);
					}
				} else if(protocol.key == "Login" || protocol.key == "Register") {
					if(protocol.payload) {
						// user now authenticated
						setCookie(AUTH, protocol.payload);
						gk.private.authenticated = true;
						gk.private.token = protocol.payload;
						$('body').append("got token: "+protocol.payload);
						updateNavBar(true);
					} else {
						// error authenticating
						$('body').append("had trouble authenticating");
						gk.private.authenticated = false;
						updateNavBar(false);
						gk.private.token = null;
						gk.private.user = null;

						// click show login
						$('#showlogin').click();
					}
				} else if(protocol.key == "Validate") {
					if(protocol.payload) {
						gk.private.authenticated = true;
						updateNavBar(true);
						$('body').append("validated! signed in!");
					} else {
						gk.private.authenticated = false;
						updateNavBar(false);
						gk.private.token = null;
						gk.private.user = null;
						setCookie(AUTH, "");
						$('body').append("had trouble validating");
					}
				} else if(protocol.key == "GetUser") {
					if(protocol.payload) {
						gk.private.user = protocol.payload;
						// update UI?
						$('body').append("got user: "+gk.private.user);
					} else {
						// couldn't get user?
						$('body').append("couldn't get user");
					}
				} else if(protocol.key == "SetUser") {
					if(protocol.payload) {
						$('body').append("updated user");
					} else {
						$('body').append("failed to update user");
					}
				} else if(protocol.key == "Logout") {
					// logout
					if(protocol.payload) {
						// logged out
						setCookie(AUTH, "");
						$('body').append("logged out");
						gk.private.authenticated = false;
						updateNavBar(false);
						gk.private.token = null;
						gk.private.user = null;
					} else {
						$('body').append("had trouble logging out");
					}
				} else {
					console.log("unknown key/value "+protocol.key+"/"+protocol.payload+" sent from GateKeeper to client");
				}
			}
		}
	}

	return gk;
}

