App.Scene = DS.Model.extend({
	model3d: DS.belongsTo('model3d'),
	opcLayout: DS.belongsTo('opcLayout'),
	sceneView: DS.belongsTo('sceneView')
});