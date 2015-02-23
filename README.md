# node_clientserver
I'm writing some js code that can run on both client and node-server

Here's all the files you might find in a basic framework+simple app scenario
I gloss over index.html, jquery.min.js, and main.css because those are boring

GateKeeper.js
This is the master server. You run it somewhere where the clients know where to connect to it.
This is a http webserver too, when you hit it on whatever port, it'll give you the files you need for client.
When a client connects, they'll get a list of available servers they can join
When a server connects, it'll register itself and be advertised to clients

GateKeeperSettings.js
These private settings are really only seen by GateKeeper.js


Server.js
This is a game server, multiple can be run from various locations
Each Server.js instance has game state, a list of players connected, etc
It's one fully fledged game

ServerSettings.js
Similar, private settings for the server

HTTPServer.js
Almost unmodified boilerplate
The only modification is that it's locked to the html/ subdirectory
And when you request a directory, it appends /client/index.html
So / and /client/index.html are the same

/html
This is a directory available to all clients

/html/client
This is the directory for code that's used exclusively by the client

/html/client/Client.js
This is the client base javascript file, it connects to the gatekeeper
In a real application, it would have code for rendering the game state, listing servers, connecting to a server, etc

/html/server
This is the directory for code that's shared between client and server

/html/server/GateKeeperInfo.js
This is public GateKeeper info, such as what http and websocket ports it uses, and what hostname the server should connect to
GameKeeperInfo.js is also responsible for registering classes with ServerExchange so that client and server can send smart objects across the wire

/html/server/ServerExchange.js
This is a transferrable object that wraps other transferrable objects
You can specify a key and payload, and it'll try to use the registered method for deserializing the object based on the key
You register these methods manually with ServerExchange.register(key, function)

/html/server/ServerInfo.js
This is a customizable file representing the state of the server
The GateKeeper requests these objects from each server, and each server responds with one

