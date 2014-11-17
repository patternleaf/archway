App.ApplicationRoute = Ember.Route.extend({
	actions: {
		handleSceneViewable: function() {
			console.log('handleSceneViewable action');
			this.transitionTo('scene');
		},
		handleSceneUnviewable: function() {
			this.transitionTo('index');
		},
		
		// awkwardly ...
		selectModel3dFile: function() {
			var appController = this.controllerFor('application');
			return appController.selectModel3dFile();
		},
		selectOPCLayoutFile: function() {
			var appController = this.controllerFor('application');
			return appController.selectOPCLayoutFile();
		}
	}
});