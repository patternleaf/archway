var express = require('express'),
	rp = require('request-promise'),
	router = express.Router();

router.all('*', function(req, res, next) {
	var path = req.originalUrl.replace(req.baseUrl, ''),
		requestParams = {
			uri: req.app.get('udder-host') + path,
			method: req.method
		};
	
	// Note udder currently expects a form-encoded body, not a json body.	
	if (req.method.toLowerCase() === 'post') {
		requestParams.form = req.body;
	}
	
	if (req.query) {
		requestParams.query = req.query;
	}
	
	rp(requestParams).then(function(response) {
		console.log('response:', response);
		res.status(200).send(response);
	}).catch(function(error) {
		console.log('proxy error:', error);
		res.status(500).send(error.message);
	});
});

module.exports = router;
