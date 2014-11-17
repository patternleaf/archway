App.Scene = DS.Model.extend({
	model3d: DS.belongsTo('model3d', { async: true }),
	opcLayout: DS.belongsTo('opcLayout', { async: true }),
	sceneCamera: DS.belongsTo('sceneCamera', { async: true }),
	
	viewable: Ember.computed.or('model3d.viewable', 'opcLayout.viewable'),
	
	recursiveIsDirty: function() {
		return this.get('model3d').isDirty || this.get('opcLayout').isDirty || this.get('sceneCamera').isDirty;
	}.property('model3d.isDirty', 'opcLayout.isDirty', 'sceneCamera.isDirty'),
	
	showCameraControls: DS.attr('boolean', { defaultValue: true }),
	showLegend: DS.attr('boolean', { defaultValue: true }),
	showClientControls: DS.attr('boolean', { defaultValue: true }),
	showServerControls: DS.attr('boolean', { defaultValue: true }),
	
	init: function() {
		this._super();
		this.set('opcLayout', this.store.createRecord('opcLayout', {}));
		this.set('model3d', this.store.createRecord('model3d', {}));
		this.set('sceneCamera', this.store.createRecord('sceneCamera', {}));
	},
/*	
	handlePropertyChange: function() {
		this.trigger('updated');
	}.observes('model3d', 'opcLayout', 'sceneCamera').on('init'),
*/	
	saveRecursive: function() {
		var _this = this;
		return new Ember.RSVP.Promise(function(resolve, reject) {
			Ember.RSVP.Promise.all([
				_this.get('opcLayout'),
				_this.get('sceneCamera'),
				_this.get('model3d')
			]).then(function(values) {
				console.log('scene relationships resolved, saving .. ');
				Ember.RSVP.Promise.all([
					_this.save(),
					values[0].save(),
					values[1].save(),
					values[2].save()
				]).then(function() {
					resolve();
					console.log('scene saved');
				});
			});
		});
		// return Ember.RSVP.Promise.all([
		// 	this._super(),
		// 	this.get('opcLayout').save(),
		// 	this.get('sceneCamera').save(),
		// 	this.get('model3d').save()
		// ]);
	}
});