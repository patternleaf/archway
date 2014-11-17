App.OpcLayout = DS.Model.extend({
	name: DS.attr('string'),
	pixels: DS.hasMany('pixel', { async: true }),
	scene: DS.belongsTo('scene'),

	viewable: Ember.computed.notEmpty('pixels'),
	
	save: function() {
		var pixelPromises = this.get('pixels').toArray().map(function(pixel) {
			return pixel.save();
		});
		return Ember.RSVP.Promise.all([ this._super() ].concat(pixelPromises));
	}
});