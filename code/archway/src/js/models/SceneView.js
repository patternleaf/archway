App.SceneView = DS.Model.extend({
	x: DS.attr('number'),
	y: DS.attr('number'),
	z: DS.attr('number'),
	lat: DS.attr('number'),
	lon: DS.attr('number'),
	phi: DS.attr('number'),
	theta: DS.attr('number'),
	useDeferredRenderer: DS.attr('boolean'),
	scene: DS.belongsTo('scene')
});