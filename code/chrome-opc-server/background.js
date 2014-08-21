var OPC_PORT = 7890,
	COMMAND_PIXELS = 0
	COMMAND_SYSEX = 255;

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
			// chrome.sockets.tcp.send(info.clientSocketId, data, function(resultCode) {
			// 	console.log('Data sent to new TCP client connection.');
			// });
			// Start receiving data.
			gClientSocketId = info.clientSocketId;
			chrome.sockets.tcp.onReceive.addListener(onReceive);
			chrome.sockets.tcp.setPaused(gClientSocketId, false);
		}
	};

	function swap16(val) {
		return ((val & 0xFF) << 8) | ((val >> 8) & 0xFF);
	}
	
	var gCurrentFrame = { channel: 0, command: 0, data: [] };
	var gPayloadBytesNeeded = 0;
	var onReceive = function(info) {
		if (info.socketId == gClientSocketId) {
			
			var payloadView;
			if (gPayloadBytesNeeded == 0) {
				gCurrentFrame.channel = new Uint8Array(info.data, 0, 1)[0];
				gCurrentFrame.command = new Uint8Array(info.data, 1, 1)[0];
				gCurrentFrame.data = [];
				
				gPayloadBytesNeeded = swap16(new Uint16Array(info.data, 2, 1)[0]);
				payloadView = new Uint8Array(info.data, 4, info.data.byteLength - 4);
				//console.log('opc length: ', gPayloadBytesNeeded, 'actual length: ', info.data.byteLength);
			}
			else {
				payloadView = new Uint8Array(info.data);
			}
			
			for (var j = 0; j < payloadView.length; j++, gPayloadBytesNeeded--) {
				gCurrentFrame.data.push(payloadView[j]);
			}
			
			//console.log('bytes to go before frame is complete: ' + gPayloadBytesNeeded);

			if (gPayloadBytesNeeded == 0) {
				handleOPCMessage(gCurrentFrame.channel, gCurrentFrame.command, gCurrentFrame.data);
			}
			
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
	
	var handleOPCMessage = function(channel, command, data) {
		switch (command) {
		case COMMAND_PIXELS:
			// var colors = [];
			// for (var i = 0; i < data.length; i+=3) {
			// 	colors.push([data[i], data[i + 1], data[i + 2]]);
			// }
			chrome.runtime.sendMessage({ channel: channel, pixels: data });
			break;
		case COMMAND_SYSEX:
			break;
		}
		
	};
});