App.Model3d = DS.Model.extend({
	filePath: DS.attr('string'),
	source: DS.attr('string'),
	scene: DS.belongsTo('scene'),
	
	viewable: Ember.computed.notEmpty('source')
});

App.Model3d.parseColladaXML = function(xml) {
	return new Ember.RSVP.Promise(function(resolve, reject) {
		var loader = new THREE.ColladaLoader();
		var xmlParser = new DOMParser();
		var responseXML = xmlParser.parseFromString(xml, 'application/xml');
		loader.options.convertUpAxis = true;
		loader.parse(responseXML, function (collada) {
			var dae = collada.scene;
			dae.scale.x = dae.scale.y = dae.scale.z = 1;
			dae.updateMatrix();
			resolve({
				source: responseXML,
				sceneObject: dae
			});
		});
	});
}
/*
App.Model3dSerializer = DS.CSSerializer.extend({
	serializeAttribute: function(record, json, key, attributes) {
		if (key == 'data') {
			json.data = null;
		}
		else {
			this._super.apply(this, arguments);
		}
	},
	normalizePayload: function(payload) {
		//payload.sceneObject = 
		return payload;
	}
});
*/