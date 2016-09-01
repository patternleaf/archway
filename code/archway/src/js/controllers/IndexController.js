App.IndexController = Ember.Controller.extend(Ember.TargetActionSupport, {
	needs: ['application'],
	actions: {
		// May be able to set the target property to the application controller 
		// rather than passing through by hand.
		selectModel3dFile: function() {
			return this.get('controllers.application').selectModel3dFile();
		},
		selectOPCLayoutFile: function() {
			return this.get('controllers.application').selectOPCLayoutFile();
		}
	}
});