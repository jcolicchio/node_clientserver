var http = require('http');
var fs = require('fs');
var url = require('url');
var path = require('path');

var Settings = require('./Settings.js');

exports.init = function(webPort) {
	http.createServer(function (request, response) {
		var uri = url.parse(request.url).pathname
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
	}).listen(webPort);

	console.log("Server running at http://127.0.0.1:"+Settings.webPort+"/");
}