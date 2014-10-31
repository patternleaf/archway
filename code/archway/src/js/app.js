App = Ember.Application.create();

App.Router.map(function() {
	this.route('index', { path: '/' });
	
	this.resource('scene', { path: '/scene/:scene_id' }, function() {
		this.route('new');
		this.route('load');
	});
});


App.IndexRoute = Ember.Route.extend({});