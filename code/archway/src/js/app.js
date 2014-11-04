App = Ember.Application.create({
	LOG_TRANSITIONS: true
});

App.Router.map(function() {
	// implicit application and index routes ...
	this.route('scene', { path: '/scene' });
});


