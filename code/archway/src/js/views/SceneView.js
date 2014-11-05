App.SceneView = Ember.View.extend({
	templateName:'scene',
	init: function() {
		this._super();
	},
	
	threeScene: null,
	threeCamera: null,
	threeControls: null,
	threeRenderer: null,
	clock: null,
	viewIsAnimating: false,
	opcSceneLights: [],
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
	
	animate: function() {
		var delta = this.clock.getDelta();
		var elapsed = this.clock.getElapsedTime();
		elapsed = elapsed % (Math.PI * 2);
		
		this.threeControls.update(delta);
		this.renderThreeScene();

		if (this.isAnimating()) {
			requestAnimationFrame(Ember.$.proxy(this.animate, this));
			this.set('viewIsAnimating', true);
		}
		else {
			this.set('viewIsAnimating', false);
		}

		//updateSettings();
		
	},
	
	renderThreeScene: function() {
		this.threeRenderer.render(this.threeScene, this.threeCamera);
	},
	
	handleResize: function() {
		this.$('.scene-view, #three-view-container').height(window.innerHeight);
		this.threeCamera.aspect = window.innerWidth / window.innerHeight;
		this.threeCamera.updateProjectionMatrix();

		this.threeRenderer.setSize( window.innerWidth, window.innerHeight );
	}
});
