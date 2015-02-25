# node_clientserver
I'm writing some js code that can run on both client and node-server


## Quick start

* Make sure ports 8080, 12345, and 12350 are open
* From root directory, run: ```npm install```
* Then run: ```node GateKeeper & node Server -g <your external IP>:8080 &```
* Navigate to ```localhost:8080``` in your browser

* Server accepts the following command-line arguments:
	* ```-p <server port>```
	* ```-g <gatekeeper ip>:<gatekeeper port>```
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

##### GateKeeperSettings.js
* **Customizable**
* These private settings are really only seen by GateKeeper.js
* I need to figure out if this even warrants its own file


##### Server.js
* **Customizable**
* This is a game server, multiple can be run from various locations
* Each Server.js instance has game state, a list of players connected, etc
* It's one fully fledged "game". It can mux/demux multiple rooms if the designer of the game wants to go that route. All that is internal though, GateKeeper has no idea.

##### ServerSettings.js
* **Customizable**
* Similar, private settings for the server
* I need to figure out if this even warrants its own file

##### HTTPServer.js
* **Boilerplate**
* Almost unmodified boilerplate from another project
* The only modification is that it's locked to the html/ subdirectory

## /html
* This is a directory available to all clients

## /html/client
* This is the directory for code that's used exclusively by the client

##### /html/client/Client.js
* **Game-Specific**
* This is the client base javascript file, it connects to the the server
* In a real application, it would have code for rendering the game state, listing servers, connecting to a server, etc

##### /html/client/GateKeeperClient.js
* **Boilerplate**
* This is boilerplate code to connect to the GateKeeper, developers probably won't have to mess with this much

## /html/server
* This is the directory for code that's shared between client and server

##### /html/server/GateKeeperInfo.js
* **Boilerplate**
* This is public GateKeeper info, such as what http and websocket ports it uses, and what hostname the server should connect to

##### /html/server/ServerExchange.js
* **Boilerplate**
* This is a transferrable object that wraps other objects
* You can specify a key and payload, and it'll try to use the registered method for deserializing the object based on the key
* You register these methods manually with ServerExchange.register(key, function)
* You should register methods for each object in the object's class
 * For example, ServerInfo.js does this, it registers ServerInfo and ServerList


##### /html/server/ServerInfo.js
* **Game-Specific-ish**
* This is a customizable file representing the state of the server
* It has properties like server name, ip, players/capacity, hasPassword, etc
* The GateKeeper requests these objects from each server, and each server responds with one

## Pressing Tasks:
* Turn Server.js into a module, exposing the parts that might get used in something like GameTypeServer.js
 * GameTypeServer.js would require Server.js, and contain the game specifics
 * Server.js handles GK standard communication
* OAuth with Facebook or something
* Some kind of backend to store player stats, 
* Implement whitelist/blacklist for incoming server connections
* Devise a scheme for allowing servers to authenticate new connections with the GateKeeper
 * At the end of this process, GK should disconnect the player from GK, and have them reconnect when done with the server
 * No reason for a player in-game to sit around on GK
* Create a better game example. I'm thinking Risk, DiceWars, or Pong or something

## Easier Tasks:
* Try-catch on user-submitted data, of any kind, including server->GateKeeper
* Make sure we're going HTTPServer locked to html/ folder properly, we want to make sure the root JS is inaccessible
 * Reason being, some .js files have private config info stored in them, right?
* Drop unresponsive servers from GateKeeper's listing
* Heartbeat for each Server
 * Hand in hand with this, a mechanic for allowing players to "refresh" and live-update the refreshed listing of servers
* Timeouts when connections fail

## Future Stuff:
* When/how/why should we alert players in-server when the server loses connection with GateKeeper?
 * Might be important if the server reports user scores etc back to the GK at the end of the game

