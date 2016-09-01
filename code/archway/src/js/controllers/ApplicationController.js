App.ApplicationController = Ember.Controller.extend(Ember.Evented, {
	version: 0.1,
	scene: null,
	_lastSceneViewable: false,

	sceneViewable: Ember.computed.alias('scene.viewable'),
	
	busyMessage: '',
	busyProgress: 0,
	
	init: function() {
		this._super();
		
		//chrome.storage.local.clear(function() { console.log('cleared storage'); });
		
		this.showCurrentScene();
	},
	
	showCurrentScene: function() {
		var _this = this;
		this.store.find('scene').then(function(scenes) {
			var sceneArray = scenes.toArray();
			if (sceneArray.length) {
				console.log('Setting saved scene.');
				_this.set('scene', sceneArray[0]);

				// this seems necessary to fire the observer, and only for y, z, and lat/lng.
				// not sure why what's up.
				_this.get('scene.sceneCamera');
				
				console.log(_this.get('scene.opcLayout.pixels'));
			}
			else {
				console.log('No scenes in store. Setting default.');
				_this.set('scene', _this.store.createRecord('scene', {}));
			}
		}, function() {
			console.log('Scene request rejected. Setting default.');
			_this.set('scene', _this.store.createRecord('scene', {}));
		});
	},
	
	selectModel3dFile: function() {
		var fileFilter = [{
			mimeTypes: ['text/*'],
			extensions: ['dae']
		}];
		var controller = this;
		chrome.fileSystem.chooseEntry({ type: 'openFile', accepts: fileFilter }, function(entry) {
			if (entry) {
				controller.loadModel3d(entry);
			}
		});
	},
	selectOPCLayoutFile: function() {
		var fileFilter = [{
			mimeTypes: ['text/*'],
			extensions: ['json']
		}];
		var controller = this;
		chrome.fileSystem.chooseEntry({ type: 'openFile', accepts: fileFilter }, function(entry) {
			if (entry) {
				controller.loadLayout(entry);
			}
		});
	},
	
	actions: {
		openScene: function() {
			var _this = this;
			chrome.fileSystem.chooseEntry({ type: 'openFile' }, function(readOnlyEntry) {
				readOnlyEntry.file(function(file) {
					var reader = new FileReader();
					//reader.onerror = 
					reader.onloadend = function(event) {
						var contents = event.target.result;
						var adapter = _this.get('container').lookup('adapter:application');
						adapter.loadFromJSON(contents).then(function() {
							_this.showCurrentScene();
						}, function(error) {
							console.log('error', error);
						});
					};
					reader.readAsText(file);
				});
			});
		},
		selectModel3dFile: function() {
			this.selectModel3dFile();
		}
	},

	commands: {
		openScene: {
			shortcut: 79,
			shiftKey: false
		}
	},

	// sadly, computed properties don' seem to work when inside
	// embedded objects.
	commandOpenSceneEnabled: true,
	commandSaveSceneEnabled: Ember.computed.alias('sceneViewable'),
	commandSaveSceneAsEnabled: Ember.computed.alias('sceneViewable'),
	commandSelectOPCLayoutFileEnabled: true,
	commandSelectModel3dFileEnabled: true,


	handleSceneViewableChanged: function() {
		var sceneIsViewable = this.get('scene.viewable');
		if (sceneIsViewable && !this._lastSceneViewable) {
			this.trigger('sceneIsViewable');
		}
		else if (!sceneIsViewable && this._lastSceneViewable) {
			this.trigger('sceneIsUnviewable');
		}
		this._lastSceneViewable = sceneIsViewable;
	}.observes('scene.viewable')
	
});