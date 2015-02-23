var http = require('http');
var fs = require('fs');
var url = require('url');
var path = require('path');

var GateKeeperInfo = require('./html/server/GateKeeperInfo.js');

// TODO: make it look in html, and default to html/client/index.html
// in general, we want it to use html/client as the base path, but allow access to html/server
exports.init = function(webPort) {
	var server = http.createServer(function (request, response) {
		var uri = "html/"+url.parse(request.url).pathname
		, filename = path.join(process.cwd(), uri);

		console.log(uri+", "+filename);

		fs.exists(filename, function(exists) {
			if(!exists) {
				response.writeHead(404, {"Content-Type": "text/plain"});
				response.write("404 Not Found\n");
				response.end();
				return;
			}

			if (fs.statSync(filename).isDirectory()) {
				filename += '/client/index.html';
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