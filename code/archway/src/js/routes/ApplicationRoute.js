App.ApplicationRoute = Ember.Route.extend({
	actions: {
		updateScene: function() {
			this.transitionTo('scene');
		}
	}
});