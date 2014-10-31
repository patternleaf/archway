App.Pixel = DS.Model.extend({
	x: DS.attr('number'),
	y: DS.attr('number'),
	z: DS.attr('number'),
	group: DS.attr('number'),
	address: DS.attr('number'),
	opcLayout: DS.belongsTo('opcLayout')
});