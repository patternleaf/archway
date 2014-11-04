App.SceneController = Ember.Controller.extend({
	needs: 'application',
	scene: Ember.computed.alias('controllers.application.scene'),
	
	handleDidInsertElement: function() {
		console.log('didInsertElement: hi there');
	}.on('didInsertElement')
});