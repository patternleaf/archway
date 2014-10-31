App.ApplicationController = Ember.Controller.extend({
	version: 0.1,
	model3d: null,
	opcLayout: null,
	
	actions: {
		selectModel3dFile: function() {
			
		},
		selectOPCLayoutFile: function() {
			var accepts = [{
				mimeTypes: ['text/*'],
				extensions: ['json']
			}];
			var that = this;
			chrome.fileSystem.chooseEntry({ type: 'openFile', accepts: accepts }, function(entry) {
				if (entry) {
					that.loadLayout(entry);
				}
			});
		}
	},
		
	loadModel: function() {
		
	},
	
	loadLayout: function(entry) {
		var appController = this;
		window.appController = this;
		
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
					var layout = appController.store.createRecord('opcLayout', {
						name: file.name
					});
					console.log('layout pixels: ', layout.get('pixels'));
					for (var i = 0; i < layoutData.length; i++) {
						var pixel = appController.store.createRecord('pixel', {
							x: layoutData[i].point.x,
							y: layoutData[i].point.y,
							z: layoutData[i].point.z,
							group: layoutData[i].group,
							address: layoutData[i].address,
						});
						appController.store.push(pixel);
						layout.get('pixels').pushObject(pixel);
					}
					appController.store.push(layout);
				}
			};
			reader.readAsText(file);
		});
	},
	
	readFile: function(file, callback) {
		fileEntry.file(function(file) {
			var reader = new FileReader();

			reader.onerror = errorHandler;
			reader.onload = function(e) {
				callback(e.target.result);
			};

			reader.readAsText(file);
		});
	}
});