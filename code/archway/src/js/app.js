App = Ember.Application.create();

App.Router.map(function() {
	this.resource('archway', { path: '/' });
});


App.IndexRoute = Ember.Route.extend({
	model: function() {
		return this.store.find('scene', 1);
	}
})