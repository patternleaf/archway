App.ApplicationController = Ember.Controller.extend(Ember.TargetActionSupport, {
	version: 0.1,
	scene: null,
	
	sceneViewable: Ember.computed.alias('scene.viewable'),
	
	busyMessage: '',
	busyProgress: 0,
	
	init: function() {
		this._super();
		
		chrome.storage.local.clear(function() { console.log('cleared storage'); });
		
		this.showCurrentScene();
	},
	
	showCurrentScene: function() {
		var _this = this;
		this.store.find('scene').then(function(scenes) {
			var sceneArray = scenes.toArray();
			if (sceneArray.length) {
				console.log('Setting saved scene.');
				_this.set('scene', sceneArray[0]);
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
		selectModel3dFile: function() {
			this.selectModel3dFile();
		},
		selectOPCLayoutFile: function() {
			this.selectOPCLayoutFile();
		},
		showLegend: function() {
			this.scene.set('showLegend', true);
		},
		hideLegend: function() {
			this.scene.set('showLegend', false);
		},
		showClientControls: function() {
			this.scene.set('showClientControls', true);
		},
		hideClientControls: function() {
			this.scene.set('showClientControls', false);
		},
		showCameraControls: function() {
			this.scene.set('showCameraControls', true);
		},
		hideCameraControls: function() {
			this.scene.set('showCameraControls', false);
		},
		
		saveScene: function() {
			if (this.writableFileEntry) {
				var _this = this;
				var adapter = _this.get('container').lookup('adapter:application');
				adapter.on('localStoreUpdated', function(storage) {
					_this.writableFileEntry.createWriter(function(writer) {
						writer.write(new Blob([JSON.stringify(storage)]), { type: 'text/json' });
						adapter.off('localStoreUpdated', arguments.callee);
					})
				});
				this.scene.saveRecursive();
			}
		},
		
		saveSceneAs: function() {
			var _this = this;
			chrome.fileSystem.chooseEntry({ type: 'saveFile' }, function(writableFileEntry) {
				_this.writableFileEntry = writableFileEntry;
				writableFileEntry.createWriter(function(writer) {
					var adapter = _this.get('container').lookup('adapter:application');
					adapter.on('localStoreUpdated', function(storage) {
						console.log('writing to file ', JSON.stringify(storage));
						writer.write(new Blob([JSON.stringify(storage)]), { type: 'text/json' });
						adapter.off('localStoreUpdated', arguments.callee);
					});
					_this.scene.saveRecursive();
				}, function() {
					console.log('error creating writer');
				});
			});
		},
		
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
							console.log('scene loaded');
							_this.showCurrentScene();
						}, function(error) {
							console.log('error', error);
						});
					};
					reader.readAsText(file);
				});
			});
		}
	},

	commands: {
		openScene: {
			shortcut: 79,
			shiftKey: false
		},
		saveScene: {
			shortcut: 83,
			shiftKey: false
		},
		saveSceneAs: {
			shortcut: 83,
			shiftKey: true
		},
		selectOPCLayoutFile: {
			shiftKey: false,
		},
		selectModel3dFile: {
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

	loadModel3d: function(entry) {
		var controller = this;
		entry.file(function(file) {
			var reader = new FileReader();
			reader.onerror = function() {
				console.error('Could not read model file ', arguments);
			};
			reader.onload = function(event) {
				controller.set('scene.model3d.source', event.target.result);
			};
			reader.readAsText(file);
		});
	},
	
	loadLayout: function(entry) {
		var controller = this;
		
		entry.file(function(file) {
			var reader = new FileReader();
			
			reader.onerror = function() {
				console.error(arguments);
			};
			reader.onload = function(event) {
				var layoutData = null;
				try {
					layoutData = JSON.parse(event.target.result);
				}
				catch (e) {
					alert('Could not parse OPC layout from ' + file.name + '!');
				}
				if (layoutData) {
					var layout = controller.store.createRecord('opcLayout', {
						name: file.name
					});
					var layoutPixels = layout.get('pixels');
					layoutPixels.beginPropertyChanges();
					for (var i = 0; i < layoutData.length; i++) {
						var pixel = controller.store.createRecord('pixel', {
							x: layoutData[i].point[0],
							y: layoutData[i].point[1],
							z: layoutData[i].point[2],
							group: layoutData[i].group,
							address: layoutData[i].address,
						});
						layoutPixels.pushObject(pixel);
					}
					layoutPixels.endPropertyChanges();
					console.log('setting opcLayout with ' + layout.get('pixels').toArray().length + ' pixels');
					controller.set('scene.opcLayout', layout);
				}
			};
			reader.readAsText(file);
		});
	},
	
	handleSceneViewableChanged: function() {
		console.log('sceneViewableChanged', this.get('scene.viewable'));
		if (this.get('scene.viewable')) {
			this.triggerAction({ action: 'handleSceneViewable' });
		}
		else {
			this.triggerAction({ action: 'handleSceneUnviewable' });
		}
	}.observes('scene.viewable')
	
});