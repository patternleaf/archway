var OPC_PORT = 7890,
	COMMAND_PIXELS = 0
	COMMAND_SYSEX = 255;
var gSimWindow;
var gOPCFramesRecieved = 0;
var gFrameReportTime = 0;

function trigger() {
	if (gSimWindow && gSimWindow.contentWindow && gSimWindow.contentWindow.isReady) {
		gSimWindow.contentWindow.trigger.apply(gSimWindow, arguments);
	}
}

function publishOPCFrame(channel, view) {
	if (gSimWindow && gSimWindow.contentWindow && gSimWindow.contentWindow.isReady) {
		gSimWindow.contentWindow.setPixels(channel, view);
	}
}

chrome.app.runtime.onLaunched.addListener(function() {

	chrome.app.window.create('index.html', {
		'bounds': {
			'width': 1000,
			'height': 700
		}
	}, function(createdWindow) {
		gSimWindow = createdWindow;
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
			
			trigger('tcpAccept', {
				serverSocketId: gServerSocketId,
				clientSocketId: gClientSocketId,
				port: OPC_PORT
			});
		}
	};
	
	var onAcceptError = function(info) {
		if (info.socketId == gServerSocketId) {
			console.error('TCP accept error: ', info.resultCode);
			trigger('tcpAcceptError', { resultCode: info.resultCode });
		}
	};

	function swap16(val) {
		return ((val & 0xFF) << 8) | ((val >> 8) & 0xFF);
	}
	
	var gOPCFrame = { 
		channel: 0, 
		command: 0, 
		pixels: null,
		pixelsView: null,
		pixelsReceived: -1
	 };
	var onReceive = function(info) {
		if (info.socketId == gClientSocketId) {
			
			var receivedPayloadView, framePayloadLength;
			
			if (gOPCFrame.pixelsReceived == -1) {
				gOPCFrame.channel = new Uint8Array(info.data, 0, 1)[0];
				gOPCFrame.command = new Uint8Array(info.data, 1, 1)[0];
				framePayloadLength = swap16(new Uint16Array(info.data, 2, 1)[0]);
				gOPCFrame.pixels = new ArrayBuffer(framePayloadLength);
				gOPCFrame.pixelsView = new Uint8Array(gOPCFrame.pixels);
				gOPCFrame.pixelsReceived = 0;
				
				// start of a frame. offset data reading by the header size (4)
				receivedPayloadView = new Uint8Array(info.data, 4, info.data.byteLength - 4);
			}
			else {
				// contiuation of previous frame. don't offset reads.
				receivedPayloadView = new Uint8Array(info.data);
			}
			
			for (var j = 0; j < receivedPayloadView.length; j++) {
				gOPCFrame.pixelsView[gOPCFrame.pixelsReceived++] = receivedPayloadView[j];
			}
			
			if (gOPCFrame.pixelsReceived == gOPCFrame.pixelsView.length) {
				// frame is complete. send it on.
				handleOPCFrame(gOPCFrame);
				gOPCFrame.pixelsReceived = -1;
				gOPCFrame.pixels = null;
				gOPCFrame.pixelsView = null;
			}
			
		}
	};
	
	chrome.sockets.tcpServer.create({}, function(info) {
		chrome.sockets.tcpServer.listen(info.socketId, '127.0.0.1', OPC_PORT, function(resultCode) {
			if (resultCode < 0) {
				console.log('Error listening: ' + chrome.runtime.lastError.message);
				trigger('tcpListeningError', { message: chrome.runtime.lastError.message });
			}
			else {
				gServerSocketId = info.socketId;
				chrome.sockets.tcpServer.onAccept.addListener(onAccept);
				chrome.sockets.tcpServer.onAcceptError.addListener(onAcceptError);
				trigger('tcpListening', { port: OPC_PORT });
			}
		});
	});
	
	var handleOPCFrame = function(frame) {
		var time = new Date().valueOf();
		switch (frame.command) {
		case COMMAND_PIXELS:
			publishOPCFrame(frame.channel, frame.pixelsView);
			break;
		case COMMAND_SYSEX:
			break;
		}
		gOPCFramesRecieved++;
		if (time > (gFrameReportTime + 1000)) {
			trigger('opcFrameReport', { nFrames: gOPCFramesRecieved });
			gFrameReportTime = time;
		}
	};
});

chrome.runtime.onSuspend.addListener(function() {
	if (gSimWindow) {
		gSimWindow.contentWindow.handleSuspend();
	}
});
