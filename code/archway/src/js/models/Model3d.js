App.Model3d = DS.Model.extend({
	filePath: DS.attr('string'),
	data: DS.attr({ default: null }),
	scene: DS.belongsTo('scene')
});