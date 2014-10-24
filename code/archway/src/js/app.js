App = Ember.Application.create();

App.Router.map(function() {
	this.resource('scene', { path: '/scene/:scene_id' }, function() {
		this.route('new');
		this.route('load');
	});
});
