App.Model3d = DS.Model.extend({
	filePath: DS.attr('string'),
	scene: DS.belongsTo('scene')
});