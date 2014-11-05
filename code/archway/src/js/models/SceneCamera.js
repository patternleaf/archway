App.SceneCamera = DS.Model.extend({
	x: DS.attr('number', { defaultValue: 0 }),
	y: DS.attr('number', { defaultValue: 0 }),
	z: DS.attr('number', { defaultValue: 0 }),
	lat: DS.attr('number', { defaultValue: 0 }),
	lon: DS.attr('number', { defaultValue: 0 }),
	phi: DS.attr('number', { defaultValue: 0 }),
	theta: DS.attr('number', { defaultValue: 0 }),
	useDeferredRenderer: DS.attr('boolean', { defaultValue: false }),
	isAnimating: DS.attr('boolean', { defaultValue: true }),
	scene: DS.belongsTo('scene')
});