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
		gSimWindow.contentWindow.setOPCPixels(channel, view);
	}
}

function debug() {
	if (0) {
		console.log.apply(console, arguments);
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
	
	// The opc frame being constructed currently.
	var gOPCFrame = { 
		channel: 0, 
		command: 0, 
		pixels: null,
		pixelsView: null,
		pixelBytesReceived: -1
	 };
	var onReceive = function(info) {
		if (info.socketId == gClientSocketId) {
			
			var incomingPixelsView,
				incomingPixelsViewSize,
				opcFrameByteLength, 
				bytesInPacket = info.data.byteLength,
				packetBytesConsumed = 0;
			
			debug('--> new packet received containing ' + bytesInPacket + ' bytes');
			
			while (packetBytesConsumed < bytesInPacket) {
				
				if (gOPCFrame.pixelBytesReceived == -1) {
					// Our frame is reset. Assume the next bytes of data in the stream
					// are an OPC header.
					
					// TODO: seek for something that looks like an opc header? for the case
					// where we start getting non-packet-aligned commands in the middle of a stream
					// and are out of sync.
					
					gOPCFrame.channel = new Uint8Array(info.data, packetBytesConsumed, 1)[0];
					gOPCFrame.command = new Uint8Array(info.data, packetBytesConsumed + 1, 1)[0];
					opcFrameByteLength = swap16(new Uint16Array(info.data, packetBytesConsumed + 2, 1)[0]);
					gOPCFrame.pixels = new ArrayBuffer(opcFrameByteLength);
					gOPCFrame.pixelsView = new Uint8Array(gOPCFrame.pixels);
					gOPCFrame.pixelBytesReceived = 0;

					// account for 4-byte header in packet.
					packetBytesConsumed += 4;
					
					debug('    new frame begin: ' + 
						opcFrameByteLength + ' bytes in frame (' + (opcFrameByteLength / 3) + ' pixels). ' + 
						packetBytesConsumed + ' bytes of packet consumed.');
				}
				else {
					// Continuation in this packet of an already-existing frame.
					debug('    continuing previous frame. ' + 
						(gOPCFrame.pixelBytesReceived / 3) + ' pixels in buffer, ' + 
						(gOPCFrame.pixelsView.length - gOPCFrame.pixelBytesReceived) + ' bytes still needed (' + 
						((gOPCFrame.pixelsView.length - gOPCFrame.pixelBytesReceived) / 3) + ' pixels)');
				}

				// # of bytes to read is the smaller of: the rest of the packet, or the number of bytes needed to complete a frame.
				incomingPixelsViewSize = Math.min(
					bytesInPacket - packetBytesConsumed, 
					gOPCFrame.pixelsView.length - gOPCFrame.pixelBytesReceived
				);

				// This is the view we will read from for this pass.
				incomingPixelsView = new Uint8Array(info.data, packetBytesConsumed, incomingPixelsViewSize);

				debug('copying ' + incomingPixelsViewSize + ' bytes into frame buffer ... ');
				for (var j = 0; j < incomingPixelsViewSize; j++) {
					gOPCFrame.pixelsView[gOPCFrame.pixelBytesReceived] = incomingPixelsView[j];
					gOPCFrame.pixelBytesReceived++;
					packetBytesConsumed++;
				}
				debug('... done. ' + packetBytesConsumed + ' packet bytes consumed, ' + 
					(gOPCFrame.pixelBytesReceived / 3) + ' pixels in framebuffer'
				);

				if (gOPCFrame.pixelBytesReceived == gOPCFrame.pixelsView.length) {
					// frame is complete. send it on.
					handleOPCFrame(gOPCFrame);
					debug('[[ complete frame received. resetting framebuffer. ]]');
					gOPCFrame.pixelBytesReceived = -1;
					gOPCFrame.pixels = null;
					gOPCFrame.pixelsView = null;
				}
			}
			debug('<-- packet exhausted');
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
