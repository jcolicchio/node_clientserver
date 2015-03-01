# node_clientserver
I'm writing some js code that can run on both client and node-server


## Quick start

* Make sure ports 8080, 12345, and 12350 are open
* From root directory, run: ```npm install```
* Then run: ```node GateKeeper & node Server -g <your external IP>:8080 &```
* Navigate to ```localhost:8080``` in your browser

* Server accepts the following command-line arguments:
	* ```-p <server port>```
	* ```-h <host ip>:<host port>```
	* ```-n <server name>```
	* ```-s <server secret/password>```
    


## Project Structure
Here's all the files you might find in a basic framework+simple app scenario. I gloss over index.html, jquery.min.js, and main.css because those are boring

## /

##### GateKeeper.js
* **Boilerplate**
* This is the master server. You run it somewhere where the clients know where to connect to it.
* This is a http webserver too, when you hit it on whatever port, it'll give you the files you need for client.
* When a client connects, they'll get a list of available servers they can join
* When a server connects, it'll register itself and be advertised to clients
* The servers can be local or remote, shouldn't matter. This is for scalability
* The GateKeeper will handle user authentication, oauth or FB or something
* It'll also have options to verifying servers are legit, so no scammy servers can join
* It'll also have options for blacklisting or whitelisting IPs for server connections

##### GateKeeperSettings.js
* **Customizable**
* These private settings are really only seen by GateKeeper.js
* I need to figure out if this even warrants its own file


##### Server.js
* **Boilerplate**
* This is the part of a server that's recyclable across projects
* It handles user authentication to server and GK
* It'll handle server verification if we implement a scheme where servers need passwords

##### ServerSettings.js
* **Customizable**
* Similar, private settings for the server
* I need to figure out if this even warrants its own file


##### HTTPServer.js
* **Boilerplate**
* Almost unmodified boilerplate from another project
* The only modification is that it's locked to the html/ subdirectory

## /custom
* This folder contains custom servers that have been written as examples
* Presently, there's ChatServer.js and GameServer.js

##### /custom/ChatServer.js
* This is an example server that allows users to send messages back and forth
* It also caches previous messages in the chat
* It goes hand in hand with ```/html/chat/```

##### /custom/GameServer.js
* This is an example server that allows players to move a cursor on a shared screen
* It also allows them to select one of three colors
* It works with ```/html/game/```


## /html
* This is a directory available to all clients

## /html/client
* This is the directory for code that's used exclusively by the client
* Code that lives here is primarily boilerplate, doesn't really get customized in general use cases
* Really just shared client-only code between multiple client implementations

##### /html/client/GateKeeperClient.js
* **Boilerplate**
* This is boilerplate code to connect to the GateKeeper, developers probably won't have to mess with this much
* Usage of GateKeeperClient automatically adds/manages jQuery UI for displaying servers, with optional type filter

## /html/server
* This is the directory for code that's shared between client and server

##### /html/server/AES.js
* **Boilerplate**
* This is a convenience module for encrypting and decrypting in a uniform manner on client and server

##### /html/server/GateKeeperInfo.js
* **Boilerplate**
* This is public GateKeeper info, such as what http and websocket ports it uses, and what hostname the server should connect to

##### /html/server/Protocol.js
* **Boilerplate**
* This is a transferrable object that wraps other objects
* You can specify a key and payload, and it'll try to use the registered method for deserializing the object based on the key
* You register these methods manually with Protocol.register(key, function)
* You should register methods for each object in the object's class
 * For example, ServerInfo.js does this, it registers ServerInfo and ServerList

##### /html/server/ServerInfo.js
* **Customizable**
* This is a customizable file representing the state of the server
* It has properties like server name, ip, players/capacity, hasPassword, etc
* The GateKeeper requests these objects from each server, and each server responds with one


## Pressing Tasks:
* having an auth token
	* oauth - facebook?
		* client side, gatekeeperclient does this
		* server side, server.js includes auth as part of its protocol
		* passport - do we need express for this?
			* if so, can we tie it into the example code, auto-insert aes, gatekeeperclient, etc
			* investigate passport-socket.io, cuz we use socket.io for server->gk communication

* Some kind of backend to store player stats, custom login if they dont use fb, etc?

* strategies for limiting/validating servers
	* ip black/whitelist
	* password (using AES, same as client->server)

* Create a better game example. I'm thinking Risk, or Pong or something
* GateKeeperClient UI
	* Refreshing list of servers periodically, or based on certain events
	* Obviously I don't want to blast every GK client whenever any client joins or leaves a room
		* Actually, would this be bad? Needs testing
	* All players connected, friends list, etc

* sanitizing user input
	* making sure a server doesn't crash if the user sends something unexpected
	* making sure the user can't send html or the like

* important! investigate multithreadedness
	* definitely investigate any kind of instance where 2 clients want the server to mutate state
	* does the server handle the callbacks sequentially by nature?
	* it'd be bad if we could have code running in two places at once
	* otherwise, if not the case, it's good, we can just write callbacks to only do things in atomic ways
		* that is, dont depend on callbacks A and B occurring without C interrupting and mutating state
		* because we probably cant guarantee that unless A calls B, even if A async triggers B
			* maybe C was queued after A, but before A called B, network wise? idk.

* example code
	* index.html is a mess and requires more than 1 or 2 boilerplate JS files
	* can we figure out a way to combine them into one cleanly for production?
	* it'd be great to merge aes, jsonformatter, AES, gatekeeperclient, etc into one file
	* can we do this dynamically, with http server? i.e. insert file contents at the top of <head>

* Timeouts when connections fail
	* Speaks for itself, do websockets or socket.io handle this already?

* Reject clients if the server is "at capacity"
	* Figure out if this happens when the client authenticates or joins
	* It should probably be the case that the server only allows N authenticated users
		* Allow >N connections mid-authentication as long as <=N authenticate and successfully join

* When/how/why should we alert players in-server when the server loses connection with GateKeeper?
	* Might be important if the server reports user scores etc back to the GK at the end of the game
	
* Better handling of error messages, routing them to where they need to go, etc.

## Low Priority:
* AES uses JsonFormatter and it's weird, can we get away with format:none?
* investigate if it'd be worth it to switch entirely to socket.io (does socket.io support browser?)
* investigate ways of keeping the server running
		foreverjs?
* version numbers to verify server, client, GK are all talking the same language
* we need a name...
	* Synovial
	* Unigator
	* Served.js
	* Uninode
	* Nodify
	* Smarty
	* UnitedStates

	

