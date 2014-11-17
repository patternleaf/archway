App.SceneView = Ember.View.extend(Ember.TargetActionSupport, {
	templateName:'scene',
	init: function() {
		this._super();
	},
	
	threeScene: null,
	threeCamera: null,
	controls: {
		target: new THREE.Vector3( 0, 0, 0 ),
		movementSpeed: 48.0,
		lookSpeed: 0.3,
		lookVertical: true,
		activeLook: false,
		heightSpeed: false,
		heightCoef: 1.0,
		heightMin: 0.0,
		heightMax: 1.0,
		constrainVertical: false,
		verticalMin: 0.0,
		verticalMax: Math.PI,
		autoSpeedFactor: 0.0,
		
		viewHalfX: 0,
		viewHalfY: 0,
		
		mouseX: 0,
		mouseY: 0,
		startMouseX: 0,
		startMouseY: 0,
		mouseDragOn: false,
		
		moveForward: false,
		moveBackward: false,
		moveLeft: false,
		moveRight: false,

		lat: 0,
		lng: 0,
		phi: 0,
		theta: 0,
		
	},
	appCameraState: {
		x: 0, 
		y: 0, 
		z: 0,
		lat: 0,
		lng: 0,
		phi: 0,
		theta: 0
	},
	lastSceneCameraState: {
		x: 0, 
		y: 0, 
		z: 0,
		lat: 0,
		lng: 0,
		phi: 0,
		theta: 0
	},
	sceneCameraState: {
		x: 0, 
		y: 0, 
		z: 0,
		lat: 0,
		lng: 0,
		phi: 0,
		theta: 0
	},
	threeRenderer: null,
	$threeView: null,
	clock: null,
	isAnimating: false,
	animationRequests: [],
	ignoreNextCameraObservation: false,
	opcSceneLights: [],
	sceneModel: null,
	sceneModelAncestors: [],
	viewInited: false,
	isSaving: false,
	$canvasFocusProxy: null,
	initThreeView: function() {
		this.$threeView = this.$('#three-view-container');
		this.$canvasFocusProxy = this.$('#three-view-container-focus-proxy');
		var controllerScene = this.get('controller.scene');
		var cameraModel = controllerScene.get('sceneCamera');
		
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
		
		this.$threeView.append(this.threeRenderer.domElement);
		
		//this.threeControls = new THREE.FirstPersonControls(this.threeCamera, this.threeRenderer.domElement);
		this.controls.lng = cameraModel.get('lng');
		this.controls.lat = cameraModel.get('lat');
		this.controls.phi = cameraModel.get('phi');
		this.controls.theta = cameraModel.get('theta');
		
		//Ember.$(this.threeControls).on('updateRequested', Ember.$.proxy(this.handleControlsUpdateRequested, this));

		this.threeScene.add(new THREE.AxisHelper(120));
		
		this.$(window).on('resize', Ember.$.proxy(this.handleResize, this));
		this.handleResize();
		
		this.$canvasFocusProxy.on('focus', Ember.$.proxy(function() {
			this.canvasIsFocused = true;
			this.$threeView.addClass('focused');
		}, this)).on('blur', Ember.$.proxy(function() {
			this.canvasIsFocused = false;
			this.$threeView.removeClass('focused');
		}, this)).on('keydown', Ember.$.proxy(function(event) {
			this.keyDown(event);
			event.preventDefault();
			event.stopPropagation();
		}, this)).on('keyup', Ember.$.proxy(function(event) {
			this.keyUp(event);
			event.preventDefault();
			event.stopPropagation();
		}, this));
		
		this.clock = new THREE.Clock();
		
		if (this.isAnimating) {
			this.scheduleDraw();
		}
		
		this.set('viewInited', true);
		this.handleAppOPCPixelsUpdated();
		this.handleAppModel3dUpdated();
		
	}.on('didInsertElement'),
	
	isUsingDeferredRenderer: function() {
		return this.get('controller.scene.sceneCamera.useDeferredRenderer');
	},
	
	startAnimating: function() {
		this.set('isAnimating', true);
		this.scheduleDraw();
	},
	
	stopAnimating: function() {
		this.set('isAnimating', false);
	},
	
	addAnimationRequest: function(key) {
		if (this.animationRequests.indexOf(key) == -1) {
			this.animationRequests.push(key);
			if (this.animationRequests.length === 1) {
				this.startAnimating();
			}
		}
	},
	
	clearAnimationRequest: function(key) {
		this.animationRequests.splice(this.animationRequests.indexOf(key), 1);
		if (this.animationRequests.length === 0) {
			this.stopAnimating();
		}
	},

	animationRequestInEffect: function(key) {
		if (key) {
			return this.animationRequests.indexOf(key) != -1;
		}
		else {
			return this.animationRequests.length > 0;
		}
	},

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

	handleAppOPCPixelsUpdated: function() {
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
			var _this = this;
			pixels.forEach(function(pixel, index) {
				if (_this.isUsingDeferredRenderer()) {
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
				_this.opcSceneLights.push(sceneLight);
				_this.threeScene.add(sceneLight);
				_this.scheduleDraw();
			});
		}
	}.observes('controller.scene.opcLayout'),
	
	handleAppModel3dUpdated: function() {
		if (this.get('viewInited')) {
			if (this.sceneModel) {
				this.threeScene.remove(this.sceneModel);
				this.sceneModel = null;
				this.sceneModelAncestors = [];
			}
			var _this = this;
			var source = this.get('controller.scene.model3d.source');
			if (_.isString(source)) {
				App.Model3d.parseColladaXML(source).then(function(result) {
					console.log('parse result: ', result);
					_this.sceneModel = result.sceneObject;
					_this.threeScene.add(_this.sceneModel);
					_this.scheduleDraw();
				});
			}
			else if (_.isObject(source)) {
				source.then(function(xml) {
					App.Model3d.parseColladaXML(xml).then(function(result) {
						_this.sceneModel = result.sceneObject;
						_this.threeScene.add(this.sceneModel);
						_this.scheduleDraw();
					});	
				});
			}
		}
	}.observes('controller.scene.model3d.source'),
	
	handleAppCameraPositionUpdated: function() {
		//console.log('camera position updated');
		if (this.get('viewInited') && !this.ignoreNextCameraObservation) {
			var cameraModel = this.get('controller.scene.sceneCamera');
			this.threeCamera.position.x = parseFloat(cameraModel.get('x'));
			this.threeCamera.position.y = parseFloat(cameraModel.get('y'));
			this.threeCamera.position.z = parseFloat(cameraModel.get('z'));
			this.controls.lat = parseFloat(cameraModel.get('lat'));
			this.controls.lng = parseFloat(cameraModel.get('lng'));
			this.controls.phi = parseFloat(cameraModel.get('phi'));
			this.controls.theta = parseFloat(cameraModel.get('theta'));
			this.scheduleDraw();
		}
		else {
			this.ignoreNextCameraObservation = false;
		}
	}.observes('controller.scene.sceneCamera.positionChanged'),
	/*
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
	*/
	/*
	handleControlsUpdateRequested: function() {
		//this.draw();
		var cameraModel = this.get('controller.scene.sceneCamera');
		//console.log('writing to app camera state', this.sceneCameraState);
		//console.log('control update requested');
		this.updateSceneCamera(0.015);

		cameraModel.setProperties({
			x: this.threeCamera.position.x,
			y: this.threeCamera.position.y,
			z: this.threeCamera.position.z,
			lat: this.controls.lat,
			lng: this.controls.lng,
			phi: this.controls.phi,
			theta: this.controls.theta
		});
	},
	*/
	
	scheduleDraw: function() {
		this.animation.scheduleFrame(function() {
			this.draw();
			if (this.isAnimating) {
				this.scheduleDraw();
			}
		}, this);
	},
	
	draw: function() {
		var delta = this.clock.getDelta();
		var elapsed = this.clock.getElapsedTime();
		elapsed = elapsed % (Math.PI * 2);

		this.updateSceneCamera(0.015);
		this.renderThreeScene();
	},
	
	renderThreeScene: function() {
		this.threeRenderer.render(this.threeScene, this.threeCamera);
	},
	
	handleResize: function() {
		this.$('.scene-view, #three-view-container').height(window.innerHeight);
		this.threeCamera.aspect = window.innerWidth / window.innerHeight;
		this.threeCamera.updateProjectionMatrix();

		this.threeRenderer.setSize(window.innerWidth, window.innerHeight);
		
		this.controls.viewHalfX = this.$threeView.prop('offsetWidth') / 2;
		this.controls.viewHalfY = this.$threeView.prop('offsetHeight') / 2;
	},
	/*
	willRenderFrame: function() {
		var cameraModel = this.get('controller.scene.sceneCamera');
		this.appCameraState = cameraModel.getProperties(
			'x', 'y', 'z', 'lat', 'lng', 'phi', 'theta'
		);
		this.sceneCameraState = {
			x: this.threeCamera.position.x,
			y: this.threeCamera.position.y,
			z: this.threeCamera.position.z,
			lat: this.threeControls.lat,
			lng: this.threeControls.lng,
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
		this.lastSceneCameraState.lng = this.threeControls.lng;
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
		this.threeControls.lng = parseFloat(this.appCameraState.lng);
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
			lng: this.sceneCameraState.lng,
			phi: this.sceneCameraState.phi,
			theta: this.sceneCameraState.theta
		});
	},
	*/
	
	cameraStatesEqual: function(a, b) {
		return 	a.x == b.x &&
				a.y == b.y &&
				a.z == b.z &&
				a.lat == b.lat &&
				a.lng == b.lng &&
				a.phi == b.phi &&
				a.theta == b.theta;
	},

	mouseDown: function(event) {
		if (event.target.nodeName.toLowerCase() !== 'input') {
			this.$canvasFocusProxy.focus();
			this.controls.startMouseX = event.pageX - this.$threeView.offset().left - this.controls.viewHalfX;
			this.controls.startMouseY = event.pageY - this.$threeView.offset().top - this.controls.viewHalfY;
			this.controls.mouseDragOn = true;
			event.preventDefault();
			event.stopPropagation();
			this.addAnimationRequest('mouse');
		}
	},
	mouseUp: function(event) {
		if (event.target.nodeName.toLowerCase() !== 'input') {
			this.controls.mouseDragOn = false;
			this.clearAnimationRequest('mouse');
		}
	},
	mouseMove: function (event) {
		if (event.target.nodeName.toLowerCase() !== 'input') {
			this.controls.mouseX = event.pageX - this.$threeView.offset().left - this.controls.viewHalfX;
			this.controls.mouseY = event.pageY - this.$threeView.offset().top - this.controls.viewHalfY;
		}
	},

	keyDown: function(event) {
		if (event.target === this.$canvasFocusProxy.get(0)) {
			switch (event.keyCode) {
				case 87: /*W*/ this.controls.moveForward = true; break;
				case 65: /*A*/ this.controls.moveLeft = true; break;
				case 83: /*S*/ this.controls.moveBackward = true; break;
				case 68: /*D*/ this.controls.moveRight = true; break;
				case 82: /*R*/ this.controls.moveUp = true; break;
				case 70: /*F*/ this.controls.moveDown = true; break;
			}
		}
		if ([87, 65, 83, 68, 82, 70].indexOf(event.keyCode) > -1) {
			this.addAnimationRequest('key');
		}
	},
	
	keyUp: function(event) {
		if (event.target === this.$canvasFocusProxy.get(0)) {
			switch (event.keyCode) {
				case 87: /*W*/ this.controls.moveForward = false; break;
				case 65: /*A*/ this.controls.moveLeft = false; break;
				case 83: /*S*/ this.controls.moveBackward = false; break;
				case 68: /*D*/ this.controls.moveRight = false; break;
				case 82: /*R*/ this.controls.moveUp = false; break;
				case 70: /*F*/ this.controls.moveDown = false; break;
			}
		}
		// always clear the animation request
		this.clearAnimationRequest('key');
	},
	
	updateSceneCamera: function(delta) {
		if (this.controls.heightSpeed) {
			var y = THREE.Math.clamp(this.threeCamera.position.y, this.controls.heightMin, this.controls.heightMax);
			var heightDelta = y - this.controls.heightMin;
			this.controls.autoSpeedFactor = delta * (heightDelta * this.controls.heightCoef);
		} else {
			this.controls.autoSpeedFactor = 0.0;
		}

		var actualMoveSpeed = delta * this.controls.movementSpeed;

		if (this.controls.moveForward || (this.controls.autoForward && !this.controls.moveBackward)) {
			this.threeCamera.translateZ(-(actualMoveSpeed + this.controls.autoSpeedFactor));
		}
		if (this.controls.moveBackward) { 
			this.threeCamera.translateZ(actualMoveSpeed); 
		}
		if (this.controls.moveLeft) { 
			this.threeCamera.translateX(-actualMoveSpeed);
		}
		if (this.controls.moveRight) { 
			this.threeCamera.translateX(actualMoveSpeed);
		}
		if (this.controls.moveUp) { 
			this.threeCamera.translateY(actualMoveSpeed);
		}
		if (this.controls.moveDown) { 
			this.threeCamera.translateY( -actualMoveSpeed);
		}

		var actualLookSpeed = delta * this.controls.lookSpeed;
		if (!this.controls.mouseDragOn) {
			actualLookSpeed = 0;
		}

		var verticalLookRatio = 1;

		if (this.controls.constrainVertical) {
			verticalLookRatio = Math.PI / (this.controls.verticalMax - this.controls.verticalMin);
		}
		
		this.controls.lng += (this.controls.mouseX - this.controls.startMouseX) * actualLookSpeed;
		if(this.controls.lookVertical ) {
			this.controls.lat -= (this.controls.mouseY - this.controls.startMouseY) * actualLookSpeed * verticalLookRatio;
		}

		this.controls.lat = Math.max(-85, Math.min(85, this.controls.lat));
		this.controls.phi = THREE.Math.degToRad(90 - this.controls.lat);

		this.controls.theta = THREE.Math.degToRad(this.controls.lng);

		if ( this.controls.constrainVertical ) {
			this.controls.phi = THREE.Math.mapLinear(
				this.controls.phi, 0, Math.PI, this.controls.verticalMin, this.controls.verticalMax
			);
		}

		var targetPosition = this.controls.target,
			position = this.threeCamera.position;

		targetPosition.x = position.x + 100 * Math.sin(this.controls.phi) * Math.cos(this.controls.theta);
		targetPosition.y = position.y + 100 * Math.cos(this.controls.phi);
		targetPosition.z = position.z + 100 * Math.sin(this.controls.phi) * Math.sin(this.controls.theta);

		this.threeCamera.lookAt(targetPosition);

		this.sceneCameraState.x = this.threeCamera.position.x;
		this.sceneCameraState.y = this.threeCamera.position.y;
		this.sceneCameraState.z = this.threeCamera.position.z;
		this.sceneCameraState.lat = this.controls.lat;
		this.sceneCameraState.lng = this.controls.lng;
		this.sceneCameraState.phi = this.controls.phi;
		this.sceneCameraState.theta = this.controls.theta;

		if (!this.cameraStatesEqual(this.lastSceneCameraState, this.sceneCameraState)) {
			var cameraModel = this.get('controller.scene.sceneCamera');
			//console.log('writing to app camera state', this.sceneCameraState);
			cameraModel.setProperties({
				x: this.sceneCameraState.x,
				y: this.sceneCameraState.y,
				z: this.sceneCameraState.z,
				lat: this.sceneCameraState.lat,
				lng: this.sceneCameraState.lng,
				phi: this.sceneCameraState.phi,
				theta: this.sceneCameraState.theta
			});
			this.ignoreNextCameraObservation = true;
		}
		
		this.lastSceneCameraState.x = this.threeCamera.position.x;
		this.lastSceneCameraState.y = this.threeCamera.position.y;
		this.lastSceneCameraState.z = this.threeCamera.position.z;
		this.lastSceneCameraState.lat = this.controls.lat;
		this.lastSceneCameraState.lng = this.controls.lng;
		this.lastSceneCameraState.phi = this.controls.phi;
		this.lastSceneCameraState.theta = this.controls.theta;
		
	}
	
});
