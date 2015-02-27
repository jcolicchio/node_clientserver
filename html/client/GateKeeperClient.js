// This file is pretty much boilerplate, users should ideally never need to tweak it

// This file contains code for connecting to gatekeeper
// When you ask to connect, you pass it a method to call with the approriate server info
// for when you want to connect to a game server
// Presently, it passes in a ServerInfo object

// TODO: list of all players connected
// TODO: refresh mechanic needs to be fleshed out


var GateKeeperInfo = this['GateKeeperInfo'];
var ServerInfo = this['ServerInfo'];
var ServerExchange = this['ServerExchange'];

// var gk = GateKeeperClient();
// gk.typeFilter = "Dicewars";
// gk.server.onopen = function() { gk.server.send("message", "i joined!"); };


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
				gk.private.activeServer.send(JSON.stringify(ServerExchange.new(key, payload)));
			},
			close: function() {
				gk.private.activeServer.close();
			}
		},

		private: {
			socket: null,
			connected: false,
			servers: [],
			activeServer: null,

			serverList: null,
			requestServerList: function() {
				gk.private.socket.send(JSON.stringify(ServerExchange.new("ServerList", null)));
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
				gk.private.activeServer = new WebSocket("ws://"+serverInfo.serverString());
				// hide the ui, and show it again 
				
				gk.private.activeServer.onopen = function() {
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

				gk.private.activeServer.onclose = function() {
					// disconnect cruft, call onclose, re-add server list/refresh or whatever
					gk.server.connected = false;
					gk.server.authenticated = false;
					if(gk.server.onclose) {
						gk.server.onclose();
					}

					// ask GK for another server list?
					gk.private.requestServerList();
				}

				gk.private.activeServer.onmessage = function(event) {
					var exc = ServerExchange.import(event.data);
					console.log("client got server msg: "+exc.key+", "+exc.payload);

					if(gk.server.connected && gk.server.authenticated) {
						// forward to client
						if(gk.server.onmessage) {
							gk.server.onmessage(exc.key, exc.payload);
						}
					} else if(exc.key == "auth") {
						// intercept auth, do stuff
						gk.server.authenticated = true;
						// since we've authed, let the user know he's connected?
						if(gk.server.onopen) {
							gk.server.onopen();
						}

					} else if(exc.key == "password") {
						var pw = prompt("What is the password?");
						gk.server.send("password", pw);
					}
				}

				gk.private.activeServer.onerror = function() {
					if(gk.server.onerror) {
						gk.server.onerror();
					}
				}
			}
		},
		connect: function() {
			this.private.socket = new WebSocket("ws://"+window.location.hostname+":"+GateKeeperInfo.clientPort);
			this.private.socket.onopen = function() {
				console.log("Connection to GK opened");
				gk.connected = true;
			}
			this.private.socket.onclose = function() {
				console.log("Connection to GK closed");
				gk.connected = false;
			}
			this.private.socket.onerror = function() {
				console.error("Connection error");
			}
			this.private.socket.onmessage = function(event) {
				var exc = ServerExchange.import(event.data);

				if(exc.key == "ServerList") {

					gk.private.servers = exc.payload;

					if(!gk.server.connected) {
						if(gk.private.serverList) {
							gk.private.serverList.remove();
						}
						gk.private.serverList = gk.private.generateServerListElements(gk.private.servers);

						$('body').append(gk.private.serverList);
					}
				} else {
					console.log("unknown key "+exc.key+" sent from GateKeeper to client");
				}
			}
		}
	}

	return gk;
}

