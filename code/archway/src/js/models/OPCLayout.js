App.OPCLayout = DS.Model.extend({
	pixelPositions: DS.attr(),
	scene: DS.belongsTo('scene')
});