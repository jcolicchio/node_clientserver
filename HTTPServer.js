var http = require('http');
var fs = require('fs');
var url = require('url');
var path = require('path');

var GateKeeperInfo = require('./html/server/GateKeeperInfo.js');

exports.init = function(webPort) {
	var server = http.createServer(function (request, response) {


		// TODO: investigate if this is secure, make sure nobody can access files outside of this folder
		// the html/ should keep all requests within this folder, but maybe html/.. will break it out?
		var uri = "/html"+url.parse(request.url).pathname
		, filename = path.join(process.cwd(), uri);

		fs.exists(filename, function(exists) {

			// if the file doesn't exist, just end now, rather than fs.statSync a nonexistent file
			if(!exists) {
				response.writeHead(404, {"Content-Type": "text/plain"});
				response.write("404 Not Found\n");
				response.end();
				return;
			}

			if (fs.statSync(filename).isDirectory()) {
				// if the request doesn't end with a slash, we need to redirect
				if(uri[uri.length-1] != "/") {
					response.statusCode = 302;
					response.setHeader('Location', "http://" + request.headers['host'] + request.url + "/");
					response.end();
					return;
				} else {
					filename += "index.html";
				}
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