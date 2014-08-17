(function(exports) {
	function OPCServer(host, port) {
		this.host = host || 'localhost';
		this.post = port || 7890;
		
		this.tcpServer = new TcpServer(this.host, this.port);
	}
	
	OPCServer.prototype.start = function() {
		this.tcpServer.listen(function(tcpConnection, socketInfo) {
			var info = "[" + socketInfo.peerAddress + ":" + socketInfo.peerPort + "] Connection accepted!";
			console.log(socketInfo);
		    tcpConnection.addDataReceivedListener(function(data) {
				console.log('recieved: ', data);
			});
		});
	};
	
})(window);
	