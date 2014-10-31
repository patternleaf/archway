App.OpcLayout = DS.Model.extend({
	name: DS.attr('string'),
	pixels: DS.hasMany('pixel'),
	scene: DS.belongsTo('scene')
});