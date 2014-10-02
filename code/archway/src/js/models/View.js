App.View = DS.Model.extend({
	camera: DS.attr(),
	controls: DS.attr(),
	useDeferredRenderer: DS.attr('boolean')
});