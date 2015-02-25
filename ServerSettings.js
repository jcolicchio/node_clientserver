// NOTE! This file is not a part of the framework itself, it's more of a "best practices" hint to devs
// This file should be used to store all the non-public info about the server
// If you implement some sort of password scheme, you could set it here
// You could also rig up Server.js to accept a password as an argument

// Here is the list of private, non-web-accessable server settings
// These variables are accessed by the Server.js server only, the client shouldn't see them

// If need be, the developer can add a smart object to their project
// That can be passed between Client and Server, containing the necessary data.
// This would only occur in situations where there are complex, non-inferrible settings
// These settings, for whatever reason, wouldn't be shipped over with the smart Game-State object
// Really, no such setting should exist, right? Unless you wanted to cut down on bandwidth by sending the data once

// E.g. what goes here:
// BoardSize: 17;
// WinningLength: 5? Maybe this'd go in some more public-facing stuff
// Maybe that's part of the ServerInfo.js, which gets passed 

exports.defaults = {
	name: "Default Server Name",
	type: "Chat",
	host: "localhost:8080",
	port: 12350,
	capacity: 8,
	password: null
};