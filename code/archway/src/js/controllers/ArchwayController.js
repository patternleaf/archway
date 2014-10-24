App.ArchwayController = Ember.Controller.extend({
	version: 0.1,
	
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
		console.log(entry);
		
		entry.file(function(file) {
			var reader = new FileReader();
			
			reader.onerror = function() {
				console.error(arguments);
			};
			reader.onload = function(event) {
				event.target.result;
			};
			reader.readAsText(file, function(result) {
				textarea.value = result;
			});
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