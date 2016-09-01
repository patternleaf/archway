App = Ember.Application.create({
	LOG_TRANSITIONS: true
});

App.Router.map(function() {
	// implicit application and index routes ...
	this.resource('scene', { path: '/scene/:scene_id' });
	this.route('about');
});


App.ApplicationSerializer = DS.CSSerializer.extend();
App.ApplicationAdapter = DS.CSAdapter.extend({
	namespace: 'archway'
});

// http://madhatted.com/2014/8/29/testing-ember-js-apps-managing-dependencies
App.AnimationService = Ember.Object.extend({
	init: function(){
		this.fns = [];
	},
	scheduleFrame: function(fn, context) {
		var found = false;
		for (var i = 0; i < this.fns.length; i++) {
			if (this.fns[i].context === context && this.fns[i].fn === fn) {
				found = true;
				break;
			}
		}
		if (!found) {
			this.fns.push({
				fn: fn,
				context: context
			});
			Ember.run.scheduleOnce('afterRender', this, this.scheduleAnimationFrame);
		}
		
	},
	scheduleAnimationFrame: function(){
		window.requestAnimationFrame(Ember.run.bind(this, this._animateFrame));
	},
	_animateFrame: function(){
		var fnsLength = this.fns.length;
		while (fnsLength--) {
			var frame = this.fns.shift();
			frame.fn.apply(frame.context);
		}
		if (this.fns.length) {
			Ember.run.scheduleOnce('afterRender', this, this.scheduleAnimationFrame);
		}
	}
});

App.register('service:animation', App.AnimationService);
App.inject('view', 'animation', 'service:animation');