App.Model3d = DS.Model.extend({
	filePath: DS.attr('string'),
	data: DS.attr(),
	scene: DS.belongsTo('scene')
});