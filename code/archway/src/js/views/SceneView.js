App.SceneView = Ember.View.extend({
	templateName:'scene',
	init: function() {
		this._super();
	},
	
	threeScene: null,
	threeCamera: null,
	threeControls: null,
	appCameraState: {
		x: 0, 
		y: 0, 
		z: 0,
		lat: 0,
		lon: 0,
		phi: 0,
		theta: 0
	},
	lastSceneCameraState: {
		x: 0, 
		y: 0, 
		z: 0,
		lat: 0,
		lon: 0,
		phi: 0,
		theta: 0
	},
	sceneCameraState: {
		x: 0, 
		y: 0, 
		z: 0,
		lat: 0,
		lon: 0,
		phi: 0,
		theta: 0
	},
	threeRenderer: null,
	clock: null,
	viewIsAnimating: false,
	opcSceneLights: [],
	sceneModel: null,
	sceneModelAncestors: [],
	viewInited: false,
	initThreeView: function() {
		var $container = this.$('#three-view-container');
		var sceneModel = this.get('controller.scene');
		var cameraModel = sceneModel.get('sceneCamera');
		
		this.threeCamera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 2000 );
		this.threeCamera.position.set(
			cameraModel.get('x'),
			cameraModel.get('y'),
			cameraModel.get('z')
		);
	
		this.threeScene = new THREE.Scene();
		this.updateSceneLights();
		
		if (cameraModel.get('useDeferredRenderer')) {
			this.threeRenderer = new THREE.WebGLDeferredRenderer({
				width: window.innerWidth,
				height: window.innerHeight,
				scale: 1,
				antialias: false 	// doesn't work right on retina. :(
			});
		}
		else {
			this.threeRenderer = new THREE.WebGLRenderer({
				width: window.innerWidth,
				height: window.innerHeight,
				scale: 1
			});
		}
		
		$container.append(this.threeRenderer.domElement);
		
		this.threeControls = new THREE.FirstPersonControls(this.threeCamera, this.threeRenderer.domElement);
		this.threeControls.lon = cameraModel.get('lon');
		this.threeControls.lat = cameraModel.get('lat');
		this.threeControls.phi = cameraModel.get('phi');
		this.threeControls.theta = cameraModel.get('theta');

		this.threeScene.add(new THREE.AxisHelper(120));
		
		this.$(window).on('resize', Ember.$.proxy(this.handleResize, this));
		this.handleResize();
		
		this.clock = new THREE.Clock();
		
		if (this.isAnimating()) {
			requestAnimationFrame(Ember.$.proxy(this.animate, this));
			this.set('viewIsAnimating', true);
		}
		this.set('viewInited', true);
		this.updateOPCPixels();
		this.updateModel3d();
		
	}.on('didInsertElement'),
	
	isAnimating: function() {
		return this.get('controller.isAnimating');
	},
	
	isUsingDeferredRenderer: function() {
		return this.get('controller.scene.sceneCamera.useDeferredRenderer');
	},
	
	restartAnimation: function() {
		if (this.get('controller.isAnimating') && !this.get('viewIsAnimating')) {
			requestAnimationFrame(Ember.$.proxy(this.animate, this));
			this.set('viewIsAnimating', true);
		}
	}.observes('controller.isAnimating'),

	updateSceneLights: function() {
		this.threeScene.add(new THREE.AmbientLight(0x444444));
		
		var directionalLight = new THREE.DirectionalLight(/*Math.random() * 0xffffff*/0x555544 );
		var directionalLight2 = new THREE.DirectionalLight(/*Math.random() * 0xffffff*/0x444466 );
		directionalLight.position.x = 200;
		directionalLight.position.y = 800;
		directionalLight.position.z = -50;
		//directionalLight.position.normalize();
		directionalLight.castShadow = true;
		directionalLight.shadowCameraLeft = -100;
		directionalLight.shadowCameraRight = 600;
		directionalLight.shadowCameraTop = 400;
		directionalLight.shadowCameraBottom = -200;
		directionalLight.shadowBias = 0.0001;
		directionalLight.shadowDarkness = 0.5;
		directionalLight.shadowMapWidth = 2048;//SHADOW_MAP_WIDTH;
		directionalLight.shadowMapHeight = 2048;//SHADOW_MAP_HEIGHT;
		//directionalLight.shadowCameraVisible = true;
	
		directionalLight2.position.x = 100;
		directionalLight2.position.y = 300;
		directionalLight2.position.z = 20;
		directionalLight2.position.normalize();
		//directionalLight2
	
		this.threeScene.add(directionalLight);
		this.threeScene.add(directionalLight2);
	},

	updateOPCPixels: function() {
		if (this.get('viewInited')) {
			if (this.opcSceneLights.length) {
				// remove previous pixels from scene.
				for (var i = 0; i < this.opcSceneLights.length; i++) {
					this.threeScene.remove(this.opcSceneLights[i]);
				}
				this.opcSceneLights = [];
			}
			var pixels = this.get('controller.scene.opcLayout.pixels');
			var sceneLight;
			var controller = this;
			pixels.forEach(function(pixel, index) {
				if (controller.isUsingDeferredRenderer()) {
					sceneLight = new THREE.PointLight(new THREE.Color(0, 0, 0), 0.5, 60);
				}
				else {
					sceneLight = new THREE.Mesh(
						new THREE.SphereGeometry(0.5, 4, 4), 
						new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1) })
					);
				}
				sceneLight.opcAddress = pixel.get('address');
				sceneLight.group = pixel.get('group');
			
				sceneLight.position = new THREE.Vector3(
					pixel.get('x'),
					pixel.get('y'),
					pixel.get('z')
				);
				controller.opcSceneLights.push(sceneLight);
				controller.threeScene.add(sceneLight);
			});
		}
	}.observes('controller.scene.opcLayout'),
	
	updateModel3d: function() {
		if (this.get('viewInited')) {
			if (this.sceneModel) {
				this.threeScene.remove(this.sceneModel);
				this.sceneModel = null;
				this.sceneModelAncestors = [];
			}
			this.sceneModel = this.get('controller.scene.model3d.data');
			//console.log(this.sceneModel);
			//this.modifyModelMesh(this.sceneModel, 'root')
			
			this.threeScene.add(this.sceneModel);
		}
	}.observes('controller.scene.model3d.data'),
	
	modifyModelMesh: function(parent, parentName) {
		var archMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });
		var buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x999999 });
		var view = this;
		if (_(parent).has('children')) {
			_(parent.children).each(function(child) {
				if (child instanceof THREE.Mesh) {
					if (_(view.sceneModelAncestors).any(function(name) { return name.indexOf('gate-') == 0; })) {
						child.material = archMaterial;
						child.castShadow = true;
					}
					else {
						child.material = buildingMaterial;
						//child.castShadow = true;
						child.receiveShadow = true;
					}
				}
				view.sceneModelAncestors.push(child.name);
				view.modifyModelMesh(child, child.name);
				view.sceneModelAncestors.pop();
			});	
		}
	},
	
	animate: function() {
		var delta = this.clock.getDelta();
		var elapsed = this.clock.getElapsedTime();
		elapsed = elapsed % (Math.PI * 2);
		
		this.threeControls.update(delta);
		
		this.willRenderFrame();
		this.renderThreeScene();
		this.didRenderFrame();
		
		if (this.isAnimating()) {
			requestAnimationFrame(Ember.$.proxy(this.animate, this));
			this.set('viewIsAnimating', true);
		}
		else {
			this.set('viewIsAnimating', false);
		}
	},
	
	renderThreeScene: function() {
		this.threeRenderer.render(this.threeScene, this.threeCamera);
	},
	
	handleResize: function() {
		this.$('.scene-view, #three-view-container').height(window.innerHeight);
		this.threeCamera.aspect = window.innerWidth / window.innerHeight;
		this.threeCamera.updateProjectionMatrix();

		this.threeRenderer.setSize(window.innerWidth, window.innerHeight);
	},
	
	willRenderFrame: function() {
		var cameraModel = this.get('controller.scene.sceneCamera');
		this.appCameraState = cameraModel.getProperties(
			'x', 'y', 'z', 'lat', 'lon', 'phi', 'theta'
		);
		this.sceneCameraState = {
			x: this.threeCamera.position.x,
			y: this.threeCamera.position.y,
			z: this.threeCamera.position.z,
			lat: this.threeControls.lat,
			lon: this.threeControls.lon,
			phi: this.threeControls.phi,
			theta: this.threeControls.theta
		};
		
		var newSceneState = !this.cameraStatesEqual(this.sceneCameraState, this.lastSceneCameraState);
		
		// app has new state and our state hasn't changed since the last frame
		if (!this.cameraStatesEqual(this.appCameraState, this.sceneCameraState) && 
			!newSceneState) {
			this.readStateFromApp();
		} else if (newSceneState) {
			this.writeStateToApp();
		}
	},
	
	didRenderFrame: function() {

		this.lastSceneCameraState.x = this.threeCamera.position.x;
		this.lastSceneCameraState.y = this.threeCamera.position.y;
		this.lastSceneCameraState.z = this.threeCamera.position.z;
		this.lastSceneCameraState.lat = this.threeControls.lat;
		this.lastSceneCameraState.lon = this.threeControls.lon;
		this.lastSceneCameraState.phi = this.threeControls.phi;
		this.lastSceneCameraState.theta = this.threeControls.theta;
	},
	
	readStateFromApp: function() {
		//console.log('reading from app camera state');
		// not sure why we're getting strings as the values intead of numbers. :(
		this.threeCamera.position.x = parseFloat(this.appCameraState.x);
		this.threeCamera.position.y = parseFloat(this.appCameraState.y);
		this.threeCamera.position.z = parseFloat(this.appCameraState.z);
		this.threeControls.lat = parseFloat(this.appCameraState.lat);
		this.threeControls.lon = parseFloat(this.appCameraState.lon);
		this.threeControls.phi = parseFloat(this.appCameraState.phi);
		this.threeControls.theta = parseFloat(this.appCameraState.theta);
	},
	
	writeStateToApp: function() {
		var cameraModel = this.get('controller.scene.sceneCamera');
		//console.log('writing to app camera state', this.sceneCameraState);
		cameraModel.setProperties({
			x: this.sceneCameraState.x,
			y: this.sceneCameraState.y,
			z: this.sceneCameraState.z,
			lat: this.sceneCameraState.lat,
			lon: this.sceneCameraState.lon,
			phi: this.sceneCameraState.phi,
			theta: this.sceneCameraState.theta
		});
	},
	
	cameraStatesEqual: function(a, b) {
		return 	a.x == b.x &&
				a.y == b.y &&
				a.z == b.z &&
				a.lat == b.lat &&
				a.lon == b.lon &&
				a.phi == b.phi &&
				a.theta == b.theta;
	}
});
