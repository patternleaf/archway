App.ApplicationController = Ember.Controller.extend(Ember.TargetActionSupport, {
	version: 0.1,
	scene: null,
	
	init: function() {
		this._super();
		this.set('scene', this.store.createRecord('scene', {}));
	},
	
	actions: {
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
		}
	},


	loadModel3d: function(entry) {
		var controller = this;
		entry.file(function(file) {
			var reader = new FileReader();
			reader.onerror = function() {
				console.error('Could not read collada file ', arguments);
			};
			reader.onload = function(event) {
				var loader = new THREE.ColladaLoader();
				var xmlParser = new DOMParser();
				var responseXML = xmlParser.parseFromString(event.target.result, 'application/xml');
				loader.options.convertUpAxis = true;
				loader.parse(responseXML, function (collada) {
					var dae = collada.scene;
					dae.scale.x = dae.scale.y = dae.scale.z = 1;
					dae.updateMatrix();
					//modifyModelMesh(dae, 'root');
					controller.set('scene.model3d.data', dae);
					controller.triggerAction({
						action: 'updateScene'
					});
				});
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
					for (var i = 0; i < layoutData.length; i++) {
						var pixel = controller.store.createRecord('pixel', {
							x: layoutData[i].point[0],
							y: layoutData[i].point[1],
							z: layoutData[i].point[2],
							group: layoutData[i].group,
							address: layoutData[i].address,
						});
						layout.get('pixels').pushObject(pixel);
					}
					controller.set('scene.opcLayout', layout);
					controller.triggerAction({
						action: 'updateScene'
					});
				}
			};
			reader.readAsText(file);
		});
	}
});