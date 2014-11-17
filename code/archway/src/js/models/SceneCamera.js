App.SceneCamera = DS.Model.extend({
	x: DS.attr('number', { defaultValue: 0 }),
	y: DS.attr('number', { defaultValue: 0 }),
	z: DS.attr('number', { defaultValue: 0 }),
	lat: DS.attr('number', { defaultValue: 0 }),
	lng: DS.attr('number', { defaultValue: 0 }),
	phi: DS.attr('number', { defaultValue: 0 }),
	theta: DS.attr('number', { defaultValue: 0 }),
	
	positionChanged: false,
	
	notifyPositionChange: function() {
		//console.log('triggering positionChanged');
		this.trigger('positionChanged', this.getProperties(
			'x', 'y', 'z', 'lat', 'lng', 'phi', 'theta'
		));
		this.set('positionChanged', true);
		Ember.run.scheduleOnce('afterRender', this, function() {
			// don't trigger observers
			this.positionChanged = false;
		});
	}.observes('x', 'y', 'z', 'lat', 'lng', 'phi', 'theta'),
	
	useDeferredRenderer: DS.attr('boolean', { defaultValue: false }),
	isAnimating: DS.attr('boolean', { defaultValue: true }),
	
	scene: DS.belongsTo('scene'),
	
	save: function() {
		console.log('saving sceneCamera');
		return this._super.apply(this, arguments);
	}
});