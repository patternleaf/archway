App.Scene = DS.Model.extend({
	model3d: DS.belongsTo('model3d'),
	opcLayout: DS.belongsTo('opcLayout'),
	sceneCamera: DS.belongsTo('sceneCamera'),
	
	viewable: function() {
		return (this.get('model3d').get('data') != null) || (this.get('opcLayout').get('pixels').length > 0);
	}.property('model3d', 'opcLayout'),
	
	showCameraControls: DS.attr('boolean', { defaultValue: true }),
	showLegend: DS.attr('boolean', { defaultValue: true }),
	showClientControls: DS.attr('boolean', { defaultValue: true }),
	showServerControls: DS.attr('boolean', { defaultValue: true }),
	
	init: function() {
		this._super();
		this.set('opcLayout', this.store.createRecord('opcLayout', {}));
		this.set('model3d', this.store.createRecord('model3d', {}));
		this.set('sceneCamera', this.store.createRecord('sceneCamera', {}));
	}
});