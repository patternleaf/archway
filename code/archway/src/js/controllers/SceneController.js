App.SceneController = Ember.Controller.extend({
	needs: 'application',
	scene: Ember.computed.alias('controllers.application.scene'),
	
	actions: {
		pauseAnimation: function() {
			this.set('isAnimating', false);
		},
		playAnimation: function() {
			this.set('isAnimating', true);
		},
	},
	
	// handleCameraPositionUpdated: function() {
	// 	this.save();
	// }.observes('scene.sceneCamera.positionChanged'),
	//
	save: function() {
		return this.get('scene').save();
	}
});