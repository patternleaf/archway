App.Scene = DS.Model.extend({
	model3d: DS.hasOne('model3d'),
	opcLayout: DS.hasOne('opcLayout'),
	view: DS.attr()
});