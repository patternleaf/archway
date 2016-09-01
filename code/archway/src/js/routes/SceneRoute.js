App.SceneRoute = Ember.Route.extend({
	model: function(params) {
		return this.store.find('scene', params.scene_id);
	},
	setupController: function(controller, model) {
		controller.set('model', model);
	}
});
