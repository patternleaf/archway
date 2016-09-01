App.ApplicationRoute = Ember.Route.extend({

	handleSceneViewable: function() {
		this.transitionTo('scene');
	},
	handleSceneUnviewable: function() {
		this.transitionTo('index');
	},

	setupController: function(controller, model) {
		controller.on('sceneIsViewable', Em.$.proxy(this.handleSceneViewable, this))
		controller.on('sceneIsUnviewable', Em.$.proxy(this.handleSceneUnviewable, this))
		return this._super.apply(this, arguments);
	}
});