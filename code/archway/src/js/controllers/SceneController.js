App.SceneController = Ember.Controller.extend({
	needs: 'application',
	scene: Ember.computed.alias('controllers.application.scene'),
	isAnimating: Ember.computed.alias('controllers.application.scene.sceneCamera.isAnimating'),
	
	actions: {
		pauseAnimation: function() {
			this.set('isAnimating', false);
		},
		playAnimation: function() {
			this.set('isAnimating', true);
		}
	}
});