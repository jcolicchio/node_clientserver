var http = require('http');
var fs = require('fs');
var url = require('url');
var path = require('path');

var GateKeeperInfo = require('./html/server/GateKeeperInfo.js');

// TODO: make it look in html, and default to html/client/index.html
// in general, we want it to use html/client as the base path, but allow access to html/server
exports.init = function(webPort) {
	var server = http.createServer(function (request, response) {

		// TODO: investigate if this is secure, make sure nobody can access files outside of this folder
		// the html/ should keep all requests within this folder, but maybe html/.. will break it out?
		var uri = "html/"+url.parse(request.url).pathname
		, filename = path.join(process.cwd(), uri);

		fs.exists(filename, function(exists) {
			if(!exists) {
				response.writeHead(404, {"Content-Type": "text/plain"});
				response.write("404 Not Found\n");
				response.end();
				return;
			}

			if (fs.statSync(filename).isDirectory()) {
				filename += '/index.html';
			}

			fs.readFile(filename, "binary", function(err, file) {
				if(err) {
					response.writeHead(500, {"Content-Type": "text/plain"});
					response.write(err + "\n");
					response.end();
					return;
				}

				response.writeHead(200);
				response.write(file, "binary");
				response.end();
			});
		});
	});

	server.listen(webPort);

	console.log("Server running at http://127.0.0.1:"+GateKeeperInfo.webPort+"/");

	return server;
}