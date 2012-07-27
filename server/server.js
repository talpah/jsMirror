/* Required libs */
var http = require('http');
var sockjs = require('sockjs');
var node_static = require('node-static');

/* Sock server init */
var sjsServerOptions = {sockjs_url: "http://cdn.sockjs.org/sockjs-0.3.min.js"};
var sjsMirrorServer = sockjs.createServer(sjsServerOptions);

/* Global variables */
var clientList = [];
var pilotList = [];

/* Sock server new connection listener */
sjsMirrorServer.on('connection', function(sjsConnectionInstance) {
	/* Add client to stack */
	clientList.push(sjsConnectionInstance);
        broadcastMessageToPilots(sjsConnectionInstance.id + ' connected.');

	/* Client data listener */
	sjsConnectionInstance.on('data', function(message) {
		var response = false;
		switch (message) {
		/* Auth as pilot */
		/* TODO: Implement an auth strategy */
		case "/auth":
			/* Add client to pilot stack */
			pilotList.push(sjsConnectionInstance);
			/* Remove from client stack */
			var tempClientList = [];
			for (var ccon in clientList) {
				if (clientList[ccon].id != sjsConnectionInstance.id) {
					tempClientList.push(clientList[ccon]);
				}
			}
			clientList = tempClientList;
			/* Announce change to pilots */
			broadcastMessageToPilots(sjsConnectionInstance.id + ' logged in.');
			response = false;
			break;
		default:
			response = message;
			break;
		}
		/* If response is valid, broadcast it */
		/* TODO: pair pilots and clients and route messages accordingly */
		if (response) {
			for (cconn in clientList) {
				clientList[cconn].write(response);
			}
		}
	});
});

/* Server for static files */
var static_directory = new node_static.Server(__dirname + '/../static/');

/* HTTP setup */
var server = http.createServer();
server.addListener('request', function(req, res) {
	static_directory.serve(req, res);
});
server.addListener('upgrade', function(req,res){
	res.end();
});

/* Sock server handler */
sjsMirrorServer.installHandlers(server, {prefix:'/mirror'});

console.log('[*] Listening on 0.0.0.0:9999' );
/* Start listening */
server.listen(9999, '0.0.0.0');




function broadcastMessageToPilots(message) {
    for (cconn in pilotList) {
     	pilotList[cconn].write(message);
    }
}
