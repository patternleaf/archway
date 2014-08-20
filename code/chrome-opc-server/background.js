var OPC_PORT = 7890;

chrome.app.runtime.onLaunched.addListener(function() {
	chrome.app.window.create('window.html', {
		'bounds': {
			'width': 1000,
			'height': 700
		}
	});

	var gServerSocketId, gClientSocketId;
	var onAccept = function(info) {
		if (info.socketId == gServerSocketId) {
			// A new TCP connection has been established.
			console.log('onAccept: ', info);
			// chrome.sockets.tcp.send(info.clientSocketId, data, function(resultCode) {
			// 	console.log('Data sent to new TCP client connection.');
			// });
			// Start receiving data.
			gClientSocketId = info.clientSocketId;
			chrome.sockets.tcp.onReceive.addListener(onReceive);
			chrome.sockets.tcp.setPaused(gClientSocketId, false);
		}
	};

	var onReceive = function(info) {
		if (info.socketId == gClientSocketId) {
			var view = new Uint8Array(info.data);
			handleOPCRawMessage(new Uint8Array(info.data));
		}
	};
	
	chrome.sockets.tcpServer.create({}, function(info) {
		chrome.sockets.tcpServer.listen(info.socketId, '127.0.0.1', OPC_PORT, function(resultCode) {
			if (resultCode < 0) {
				console.log('Error listening: ' + chrome.runtime.lastError.message);
			}
			else {
				gServerSocketId = info.socketId;
				chrome.sockets.tcpServer.onAccept.addListener(onAccept);
			}
		});
	});
	
	var handleOPCRawMessage = function(data) {

	};
	console.log(document);
});