var express = require('express'),
	router = express.Router(),
	SSH = require('simple-ssh'),
	fs = require('fs');

var kLocal = false,
	config = JSON.parse(fs.readFileSync('./config.json', { encoding: 'utf8' }));

// config: {
//		hostname: <hostname>,
//		scriptPath: <script-path>,
//		username: <username>
// }

function send(commands) {
	var ssh = new SSH({
		host: config.hostname,
		user: config.username
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
