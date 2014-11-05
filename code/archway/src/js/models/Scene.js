App.Scene = DS.Model.extend({
	model3d: DS.belongsTo('model3d'),
	opcLayout: DS.belongsTo('opcLayout'),
	sceneCamera: DS.belongsTo('sceneCamera'),
	
	init: function() {
		this._super();
		this.set('opcLayout', this.store.createRecord('opcLayout', {}));
		this.set('model3d', this.store.createRecord('model3d', {}));
		this.set('sceneCamera', this.store.createRecord('sceneCamera', {}));
	}
});