var express = require('express'),
	router = express.Router(),
	SSH = require('simple-ssh');

var kLocal = false,
	config = {};

if (kLocal) {
	config.hostname = '120.0.0.1';
	config.scriptPath = '/Users/eric/Development/archway/code/utilities/light-opc-range.py';
}
else {
	config.hostname = '50.246.208.133';
	config.scriptPath = '/home/pi/archway-stuff/opc-utilities/light-opc-range.py';
}

function send(commands) {
	var ssh = new SSH({
		host: config.hostname,
		user: 'pi',
		pass: 'Udder_P1'
	});
	try {
		commands.forEach(function(command) {
			ssh.exec(command.command, command.options || {});
		});
		ssh.start();
	}
	catch (e) {
		console.log('caught ', e);
		res.status(500).send({ success: false });
	}
}

var buildStandardSshOptions = function(res) {
	return {
		out: function(stdout) {
			console.log('stdout:', stdout);
		},
		err: function(stderr) {
			console.log('stderr:', stderr);
		},
		exit: function(code) {
			console.log('code:', code);
			if (code == 0) {
				res.status(200).send({ success: true });
			}
			else {
				res.status(500).send({ success: false, code: 0 });
			}
		}
	};
};

router.post('/', function(req, res, next) {
	var args = req.body;
	var killCommand = { 
		command: 'kill $(ps aux | grep \'[p]ython\' | awk \'{print $2}\')'
	};
	var onCommand = {
		command: 'python ' + config.scriptPath + ' --start ' + parseInt(args.start) + ' --end ' + parseInt(args.end) + ' &',
		options: buildStandardSshOptions(res)
	};

	send([killCommand, onCommand]);
});

router.post('/kill-all', function(req, res, next) {
	var offCommand = {
		command: 'python ' + config.scriptPath + ' --start -1 --end -1 &'
	};
	var killCommand = {
		command: 'kill $(ps aux | grep \'[p]ython\' | awk \'{print $2}\')',
		options: buildStandardSshOptions(res)
	}
	send([offCommand]);
	setTimeout(function() { send([killCommand]); }, 1000);
});

module.exports = router;
