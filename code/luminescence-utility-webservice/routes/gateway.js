var express = require('express'),
	router = express.Router();
	
router.get('/', function(req, res, next) {
	res.status(200).send('hi there');
});

module.exports = router;
