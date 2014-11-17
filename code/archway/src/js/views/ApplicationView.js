App.ApplicationView = Ember.View.extend({
	classNames: ['site-wrapper'],
	
	init: function () {
		this._super();
	},
	didInsertElement: function() {
		this.$(document).on('keyup', Ember.$.proxy(this.keyUp, this));
		this.$(document).on('keydown', Ember.$.proxy(this.keyDown, this));
	},
	keyDown: function(event) {
		//console.log(event.keyCode);
		
		var commands = this.get('controller').commands;
		// assuming metakey is necessary for now
		if (event.metaKey) {
			for (var commandName in commands) {
				var command = commands[commandName];
				if (_(command).has('shortcut')) {

					if (event.keyCode == command.shortcut) {
						if (command.shiftKey === event.shiftKey) {
							//console.log('triggering action ', commandName);
							this.get('controller').triggerAction({ 
								action: commandName,
								target: this.get('controller')
							});
						}
					}
				}
			}
		}
	},
	
	keyUp: function(event) {
		//console.log('application keyup', event);

	}
});
