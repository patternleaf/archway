
var gSettings = false;
var gModelLoaded = false;
var gResetting = false;
var gEventDispatcher = {};

// LED strip parameters
// strips come in pairs with a box between them
// BUT for now the box need not be included as a gap between strips!
var kStripLength = 39.5;
var kNLightsPerStrip = 60;
var kLEDPitch = 0.66;
var kInterStripOffset = 0.5;

var container;

var camera, scene, renderer, objects, controls;
var dae;
var gLightRail1 = {
		group: null,
		meshes: [],
		curve: null,
		totalLength: 0,
		stripPairOffsets: [
			// roughly .0945 is one strip pair length
			0.103,
			0.198,
			0.292,
			0.387,
			// extra one, added during physical installation!
			0.482,
			
			0.603,
			0.697,
			0.792,
			//0.901
			0.886
		],
		conduitEntryOffset: 0.521,
		strips: [],
		lights: []
	}, 
	gLightRail2 = {
		group: null,
		meshes: [],
		curve: null,
		totalLength: 0,
		stripPairOffsets: [
			// rougly .081 is one strip pair length
			0.098,
			0.179,
			0.260,
			0.341,
			0.421,
			//0.512,
			0.515,
			0.654,
			0.736,
			0.819,
			0.904
		],
		conduitEntryOffset: 0.572,
		strips: [],
		lights: []
	},
	gPhysicallyOrderedLights = [],
	gOPCOrderedLights = [],
	gOPCPointList = [];

var gAnimating = true;

var loader = new THREE.ColladaLoader();
loader.options.convertUpAxis = true;
loader.load( 'models/model-wip.dae', function ( collada ) {

	dae = collada.scene;

	dae.scale.x = dae.scale.y = dae.scale.z = 1;
	dae.updateMatrix();
	
	modifyModelMesh(dae, 'root');

	$(gEventDispatcher).trigger('modelLoaded');
} );

var archMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });
var buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x999999 });

var ancestors = [];
function modifyModelMesh(parent, parentName) {
	if (_(parent).has('children')) {
		_(parent.children).each(function(child) {
			if (child.name == 'light-rail-gate-1') {
				gLightRail1.group = child;
				//console.log('gate 1 group: ', child);
			}
			else if (child.name == 'light-rail-gate-2') {
				gLightRail2.group = child;
				//console.log('gate 2 group: ', child);
			}
			//console.log(child.name);
			
			if (child instanceof THREE.Mesh) {
				if (_(ancestors).any(function(name) { return name.indexOf('light-rail-gate-1') == 0; })) {
					gLightRail1.meshes.push(child);
				}
				else if (_(ancestors).any(function(name) { return name.indexOf('light-rail-gate-2') == 0; })) {
					gLightRail2.meshes.push(child);
				}

				if (_(ancestors).any(function(name) { return name.indexOf('gate-') == 0; })) {
					child.material = archMaterial;
					child.castShadow = true;
				}
				else {
					child.material = buildingMaterial;
					//child.castShadow = true;
					child.receiveShadow = true;
				}
			}
			ancestors.push(child.name);
			modifyModelMesh(child, child.name);
			ancestors.pop();
		});	
	}
}

function logBoxLengths(rail, railIndex) {
	var requiredCable = 0;
	_(rail.stripPairOffsets).each(function(offset, boxIndex) {
		var onRoofExtra = 0;
		var dropLength = 8;
		var topBottomSwitchIndex = 0;
		var railSide = 'top';
		if (railIndex == 0) {
			onRoofExtra = 12.166;
			topBottomSwitchIndex = 4
		}
		else {
			onRoofExtra = 2;
			topBottomSwitchIndex = 6;
		}
		
		if (boxIndex >= topBottomSwitchIndex) {
			railSide = 'bottom';
			offset = offset - rail.conduitEntryOffset;
		}
		else {
			railSide = 'top';
			offset = rail.conduitEntryOffset - offset;
		}
		
		var baseLength = (rail.totalLength * offset / 12);

		console.log(
			'G' + (railIndex + 1) + '-B' + boxIndex + ' on-gate length: ' + feetToFeetInches(baseLength) + 
			', total length: ' + feetToFeetInches(baseLength + onRoofExtra + dropLength)
		);
		requiredCable += (baseLength + onRoofExtra + dropLength);
	});
	return requiredCable;
}

function feetToFeetInches(feet) {
	var ft = Math.floor(feet);
	var remainder = feet - ft;
	return ft + '\'' + Math.ceil(remainder * 12) + '"';
}

function init() {

	container = document.createElement( 'div' );
	document.body.appendChild( container );

	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 2000 );
	camera.position.set(
		gSettings.camera.position.x,
		gSettings.camera.position.y,
		gSettings.camera.position.z
	);
	
	scene = new THREE.Scene();
	
	scene.add(dae);

	var totalCableRequired = 0;
	_([gLightRail1, gLightRail2]).each(function(rail, railIndex) {
		_(rail.meshes).each(function(mesh) {
			//var sphere = new THREE.SphereGeometry(0.5, 8, 8);
			//var curveSegments = [];	// will be 10 total

			// In the model, the light rails are quad strips. (Using regular line geometry didn't result in
			// correctly ordered vertices for whatever reason.) First, get only the points on the front of the
			// strips. x will be 0 (wrt their group origin).
			var lightRailPoints = _(mesh.geometry.vertices).filter(function(pt) { return pt.x == 0; });
			if (rail == gLightRail1) {
				lightRailPoints.reverse();
			}

			rail.curve = new THREE.SplineCurve(_(lightRailPoints).map(function(pt) {
				// transpose ... 
				return new THREE.Vector2(pt.z, pt.y); 
			}));
			
			rail.totalLength = rail.curve.getLength();
			
			
			// uncomment to log cable requirements
			// totalCableRequired += logBoxLengths(rail, railIndex);
			
			// console.log(
			// 	'rail ' + (railIndex + 1) + ' first box distance from bottom: ',
			// 	rail.stripPairOffsets[0] * rail.totalLength / 12
			// );

			// _(rail.curve.getPoints(50)).each(function(pt) {
			// 	var blah = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0xbbffbb }));
			// 	blah.position = new THREE.Vector3(0, pt.y, pt.x).add(rail.group.position);
			// 	scene.add(blah);
			// });

			//rail.curve = new THREE.CurvePath();
			
			// The first 4 points are colinear.
			// rail.curvePath.add(new THREE.LineCurve(lightRailPoints[0], lightRailPoints[3]));
			// rail.curvePath.add(new THREE.SplineCurve(_(lightRailPoints).map(function(pt) {
			// 	return new THREE.Vector2(pt.z, pt.y);
			// })));
			
			
			//rail.curvePath = new THREE.SplineCurve(lightRailPoints);
			
			// var lineGeo = new THREE.Geometry();
			// lineGeo.vertices = _(rail.curve.getSpacedPoints(100)).map(function(pt) { return new THREE.Vector3(0, pt.y, pt.x ); });
			//
			// var tempLine = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 4 }));
			// scene.add(tempLine);
			
			//return;
			createLightsForRail(rail, railIndex);
			
			//
			// var boxGeometry = new THREE.BoxGeometry(3, 3, 3);
			// var boxMesh = new THREE.Mesh(boxGeometry, new THREE.MeshBasicMaterial({ color: 0x55ff55 }));
			// var boxParametricPos = rail.curve.getPointAt(0);
			// boxMesh.position = new THREE.Vector3(0, boxParametricPos.y, boxParametricPos.x).add(rail.group.position);
			// scene.add(boxMesh);
			//
			// boxMesh = new THREE.Mesh(boxGeometry, new THREE.MeshBasicMaterial({ color: 0x55ff55 }));
			// boxParametricPos = rail.curve.getPointAt(rail.conduitEntryOffset);
			// boxMesh.position = new THREE.Vector3(0, boxParametricPos.y, boxParametricPos.x).add(rail.group.position);
			// scene.add(boxMesh);
			//
		});
		
	});
	
	gOPCOrderedLights.sort(function(a, b) {
		return a.opcAddress - b.opcAddress;
	});
	
	//console.log(gPhysicallyOrderedLights.length + ' lights');
	for (var i = 0; i < gOPCOrderedLights.length; i++) {
		if (typeof gPhysicallyOrderedLights[gOPCOrderedLights[i].opcAddress] != 'undefined') {
			console.log('opc address ' + gOPCOrderedLights[i].opcAddress + ' already in use, physical light ' + i);
		}
		gPhysicallyOrderedLights[gOPCOrderedLights[i].opcAddress] = gOPCOrderedLights[i];
	}
	
	// initially color by physical address
	var color = new THREE.Color(0x7788ff);
	for (i = 0; i < gPhysicallyOrderedLights.length; i++) {
		color.offsetHSL(.001, 0, 0);
		if (gSettings.useDeferredRenderer) {
			gPhysicallyOrderedLights[i].color = color.clone();
		}
		else {
			gPhysicallyOrderedLights[i].material.color = color.clone();
		}
	}
	
	//console.log('total cable required: ' + totalCableRequired);
	
	//console.log((gLightRail1.lights.length + gLightRail2.lights.length) + ' lights total');


	// Lights

	scene.add( new THREE.AmbientLight( 0x444444 ) );

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
	
	scene.add(directionalLight);
	scene.add(directionalLight2);
	
	var dpr = (window.devicePixelRatio) ? window.devicePixelRatio : 1;

	if (gSettings.useDeferredRenderer) {
		renderer = new THREE.WebGLDeferredRenderer({
			width: window.innerWidth,
			height: window.innerHeight,
			scale: 1,
			antialias: false 	// doesn't work right on retina. :(
		});
	}
	else {
		renderer = new THREE.WebGLRenderer({
			width: window.innerWidth,
			height: window.innerHeight,
			scale: 1
		});
	}

//				renderer.setSize( window.innerWidth, window.innerHeight );
	//renderer.renderer.setViewport(0, 0, window.innerWidth * dpr, window.innerHeight * dpr);
	renderer.shadowMapEnabled = true;
	renderer.shadowMapType = THREE.PCFShadowMap;

	container.appendChild( renderer.domElement );

	//controls.target = new THREE.Vector3(60, 94, 20);
	//controls.addEventListener( 'change', render );
	//controls.center = new THREE.Vector3( 20, 20, 20 );
	//camera.lookAt(new THREE.Vector3( 20, 20, 20 ));

	controls = new THREE.FirstPersonControls(camera, renderer.domElement);
	controls.lon = gSettings.controls.lon;
	controls.lat = gSettings.controls.lat;
	controls.phi = gSettings.controls.phi;
	controls.theta = gSettings.controls.theta;

	scene.add(new THREE.AxisHelper(120));

	window.addEventListener( 'resize', onWindowResize, false );
	
	/*
	console.log(gOPCMaxPointValue);
	console.log(JSON.stringify(_(gOPCPointList).map(
		function(pt) { return { point: [pt.point[0] / gOPCMaxPointValue, pt.point[1] / gOPCMaxPointValue, pt.point[2] / gOPCMaxPointValue ] }; }
	)));
	*/
	onWindowResize();
}


function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

//

var gClock = new THREE.Clock();

function animate() {

	var delta = gClock.getDelta();
	var elapsed = gClock.getElapsedTime();
	elapsed = elapsed % (Math.PI * 2);
		
	controls.update(delta);
	render();

	if (gAnimating) {
		requestAnimationFrame( animate );
	}

	updateSettings();
}

var gLastSaveTime = 0;
function updateSettings() {
	var currentTime = new Date().valueOf();

	gSettings.camera.position = camera.position;
	gSettings.controls.lat = controls.lat;
	gSettings.controls.lon = controls.lon;
	gSettings.controls.phi = controls.phi;
	gSettings.controls.theta = controls.theta;
	
	// can't find the right event to hook into "unloading" ... :(
	// so just save a bunch. this is lame.
	if (isChromeApp() && currentTime > (gLastSaveTime + 1000)) {
		saveSettings();
		gLastSaveTime = currentTime;
	}
}

function render() {

	var timer = Date.now() * 0.0005;
	renderer.render( scene, camera );
}

function sortLightRailPts(points) {
	// convert to vector2s
	var startIndex = 0,
		closestDistance = 20000,
		origin2D = new THREE.Vector2(0, 0);
		pts = _(points).map(function(pt, index) { 
			//console.log(pt);
			var twoD = new THREE.Vector2(pt.z, pt.y);
			var d = twoD.distanceTo(origin2D);
			if (d < closestDistance) {
				closestDistance = d;
				startIndex = index;
			}
			return twoD; 
		});
	pts.rotate(startIndex);
	return pts;
}

function getLightStrip(length, startU) {
	var result = {
			points: [],
			total: 0
		},
		factor = 1 / length;

	for (var i = 0; i < kNLightsPerStrip; i++) {
		result.points.push(startU + (kLEDPitch * factor * i));
	}
	result.total = kLEDPitch * factor * i + (kInterStripOffset * factor);
	
	return result;
}

// points are ordered: 1 strip going up in U, then 1 strip going down in U.
// 
// 		 D --------- C [center pt] A ---------- B
//
// A: first point 
// B: end of first strip
// C: beginning of second strip
// D: end of second strip
//
function getStripPair(centerU, length) {
	var result = {
			points: {
				up: [],
				down: []
			},
			endpoints: {
				up: [],
				down: []
			}
		},
		factor = 1 / length;
	
	for (var i = 0; i < kNLightsPerStrip; i++) {
		result.points.up.push(centerU + (kInterStripOffset / 2 * factor) + (i * kLEDPitch * factor));
	}
	
	result.endpoints.up.push(result.points[0]);
	result.endpoints.up.push(result.points[result.points.length - 1]);
	
	for (i = 0; i < kNLightsPerStrip; i++) {
		result.points.down.push(centerU - (kInterStripOffset / 2 * factor) - (i * kLEDPitch * factor));
	}
	
	result.endpoints.down.push(result.points[kNLightsPerStrip]);
	result.endpoints.down.push(result.points[result.points.length - 1]);
	
	return result;
}

function getInches(length, u) {
	return length * u;
}

$('#toggle-play').on('click', function() {
	if (gAnimating) {
		pause();
	}
	else {
		play();
	}
});

function pause() {
	if (gAnimating) {
		$('#toggle-play').text('Play');
		gAnimating = false;
		
	}
}
function play() {
	if (!gAnimating) {
		$('#toggle-play').text('Pause');
		requestAnimationFrame(animate);
		gAnimating = true;
	}
}

function createLightsForRail(rail, railIndex) {
	var color = new THREE.Color(0x7788ff);

	_(rail.stripPairOffsets).each(function(stripPairOffset) {

		// var boxGeometry = new THREE.BoxGeometry(1, 1, 2);
		// var boxMesh = new THREE.Mesh(boxGeometry, new THREE.MeshBasicMaterial({ color: 0xff7700 }));
		// var boxParametricPos = rail.curve.getPointAt(stripPairOffset);
		// boxMesh.position = new THREE.Vector3(0, boxParametricPos.y, boxParametricPos.x).add(rail.group.position);
		// scene.add(boxMesh);
	
		var pair = getStripPair(stripPairOffset, rail.totalLength);
		//console.log(pair);
		
		_(['down', 'up']).each(function(stripName) {
			var stripCurvePts = [];
			for (var i = 0; i < pair.points[stripName].length; i++) {
				var opcAddress = gOPCPointList.length;
				var physicalAddress = opcAddress;
				var stripN = Math.floor(physicalAddress / 60);
				if (stripN % 2 == 0) {
					// if floor(i / 60) is even, the strip address is physically reversed
					physicalAddress = (stripN * 60) + (60 - (i % 60)) - 1;
				}
				
				var sceneLight;
				var sceneLightLabel = null;
				if (gSettings.useDeferredRenderer) {
					sceneLight = new THREE.PointLight(color, 0.5, 60);
					sceneLight.opcAddress = opcAddress;
				}
				else {
					sceneLight = new THREE.Mesh(
						new THREE.SphereGeometry(0.5, 4, 4), 
						new THREE.MeshBasicMaterial({ color: color })
					);
					sceneLight.opcAddress = opcAddress;
					//console.log(gOPCPointList.length + ' => ' + sceneLight.opcAddress);
				}
			
				var ledPoint = rail.curve.getPointAt(pair.points[stripName][i]);
		
				sceneLight.position = new THREE.Vector3(0, ledPoint.y, ledPoint.x).add(rail.group.position);
				stripCurvePts.push(sceneLight.position.clone());
				rail.lights.push(sceneLight);
				gOPCOrderedLights.push(sceneLight);
		
				gOPCPointList.push({ 
					point: [sceneLight.position.x, sceneLight.position.y, sceneLight.position.z],
					gate: railIndex,
					//address: opcAddress
					address: opcAddress
				});

				scene.add(sceneLight);
				if (0 && railIndex == 0 && ((i % 4) == 0)) {
					sceneLightLabel = makeTextSprite(physicalAddress + ', ' + opcAddress, {
						fontSize: 10,
						borderThickness: 1
					});
					sceneLightLabel.position = sceneLight.position.clone();
					scene.add(sceneLightLabel);
				}
				// if (sceneLightLabel) {
				// 	scene.add(sceneLightLabel);
				// }
			}
		

			// var stripCurve = new THREE.SplineCurve(stripCurvePts);
			// var lineGeo = new THREE.Geometry();
			// lineGeo.vertices = stripCurve.getSpacedPoints(20);
			// console.log(lineGeo.vertices);
			// var line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xbbaadd }));
			// scene.add(line);
		
			/*
			var stripCurvePath = new THREE.CurvePath();
			stripCurvePath.add(stripCurve);
			var stripShape = new THREE.Shape(
				[stripCurvePts[0], 
				new THREE.Vector2(0, 0),
				new THREE.Vector2(1, 0),
				new THREE.Vector2(1, 1),
				new THREE.Vector2(0, 1),
			]);
			console.log(stripCurvePath);
			var stripGeo = stripShape.extrude({
				extrudePath: stripCurvePath
			});
			var stripMesh = new THREE.Mesh(
				stripGeo, new THREE.MeshBasicMaterial({ color: 0x777777 })
			);
			scene.add(stripMesh);
			*/
		});
	});
}

// see http://stemkoski.github.io/Three.js/Sprite-Text-Labels.html
function makeTextSprite( message, parameters ) {
	if ( parameters === undefined ) parameters = {};
	
	var fontface = parameters.hasOwnProperty("fontface") ? 
		parameters["fontface"] : "Arial";
	
	var fontsize = parameters.hasOwnProperty("fontsize") ? 
		parameters["fontsize"] : 18;
	
	var borderThickness = parameters.hasOwnProperty("borderThickness") ? 
		parameters["borderThickness"] : 4;
	
	var borderColor = parameters.hasOwnProperty("borderColor") ?
		parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };
	
	var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
		parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };

	//var spriteAlignment = THREE.SpriteAlignment.topLeft;
		
	var canvas = document.createElement('canvas');
	var context = canvas.getContext('2d');
	context.font = "Bold " + fontsize + "px " + fontface;
    
	// get size data (height depends only on font size)
	var metrics = context.measureText( message );
	var textWidth = metrics.width;
	
	// background color
	context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
								  + backgroundColor.b + "," + backgroundColor.a + ")";
	// border color
	context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
								  + borderColor.b + "," + borderColor.a + ")";

	context.lineWidth = borderThickness;
	roundRect(context, borderThickness/2, borderThickness/2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
	// 1.4 is extra height factor for text below baseline: g,j,p,q.
	
	// text color
	context.fillStyle = "rgba(0, 0, 0, 1.0)";

	context.fillText( message, borderThickness, fontsize + borderThickness);
	
	// canvas contents will be used for a texture
	var texture = new THREE.Texture(canvas) 
	texture.needsUpdate = true;

	var spriteMaterial = new THREE.SpriteMaterial({ map: texture, useScreenCoordinates: false });
	var sprite = new THREE.Sprite(spriteMaterial);
	//sprite.scale.set(100,50,1.0);
	sprite.scale.set(25,12.5,0.25);
	return sprite;	
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
    ctx.fill();
	ctx.stroke();   
}

$('#show-opc-layout').on('click', function() {
	showOPC(getOPCLayout());
});

$('#opc-close-button').on('click', function() {
	$('#opc-modal').hide();
});

var handleSettingsLoaded = function() {
	if (gSettings.useDeferredRenderer) {
		$('#switch-renderers')
			.text('Reload with WebGL Renderer')
			.on('click', function() {
				gSettings.useDeferredRenderer = false;
				saveSettings();
				reloadSim();
			});
	}
	else {
		$('#switch-renderers')
			.text('Reload with Deferred Renderer')
			.on('click', function() {
				gSettings.useDeferredRenderer = true;
				saveSettings();
				reloadSim();
			});
	}
	if (gModelLoaded) {
		$(gEventDispatcher).trigger('ready');
	}
};

if (gSettings) {
	handleSettingsLoaded();
}
else {
	$(gEventDispatcher).on('settingsLoaded', handleSettingsLoaded);
}

$('#reset').on('click', function() {
	resetSettings();
	gResetting = true;
	reloadSim();
});

$(gEventDispatcher).on('modelLoaded', function() {
	gModelLoaded = true;
	if (gSettings) {
		$(gEventDispatcher).trigger('ready');
	}
});

$(gEventDispatcher).on('ready', function() {
	$('#loading-model-indicator').fadeOut();
	init();
	animate();
});

function showOPC(code) {
	$('#opc-code').html(code);
	$('#opc-modal').show();
}

function getOPCLayout() {
	return JSON.stringify(_(gOPCPointList).map(
		function(pt) { 
			return { 
				point: [pt.point[0], pt.point[1], pt.point[2] ],
				group: pt.gate,
				address: pt.address
			}; 
		}
	).sort(function(ptA, ptB) {
		return ptA.address - ptB.address;
	}));
}

function reloadSim() {
	if (isChromeApp()) {
		chrome.runtime.reload();
	}
	else {
		window.location = window.location;
	}
}

function saveSettings() {
	if (isChromeApp()) {
		chrome.storage.local.set({ 'archway-settings': JSON.stringify(gSettings) });
	}
	else {
		localStorage.setItem('archway-settings', JSON.stringify(gSettings));
	}
}

function loadSettings() {
	var defaults = {
		useDeferredRenderer: false,
		camera: {
			position: {
				x: 50,
				y: 100,
				z: -100
			}
		},
		controls: {
			lat: 0,
			lon: -180,
			phi: 0,
			theta: 0
		}
	};
	if (isChromeApp()) {
		var item = chrome.storage.local.get('archway-settings', function(result) {
			if (_.isEmpty(result)) {
				gSettings = defaults;
			}
			else {
				gSettings = JSON.parse(result['archway-settings']);
			}
			$(gEventDispatcher).trigger('settingsLoaded');
		});
	}
	else {
		var item = localStorage.getItem('archway-settings');
		if (item.length) {
			gSettings = JSON.parse(item);
		}
		else {
			gSettings = defaults;
		}
		$(gEventDispatcher).trigger('settingsLoaded');
	}
}

function physicalAddressToOPCAddress(physicalAddress) {
	var opcAddress = 0;
	var stripN = Math.floor(physicalAddress / 60);
	var lightIndexOnStrip = phyiscalAddress - (stripN * 60);
	if (stripN % 2 == 0) {
		// if floor(i / 60) is even, the strip address is physically reversed
		opcAddress = (stripN * 60) + (60 - (lightIndexOnStrip % 60)) - 1;
	}
	return opcAddress;
}

function resetSettings() {
	if (isChromeApp()) {
		chrome.storage.local.remove('archway-settings');
	}
	else {
		localStorage.removeItem('archway-settings');
	}

}

function isChromeApp() {
	return (chrome && ('runtime' in chrome));
}

// @param pixels Uint8Array of bytes in OPC order.
// (eg, pixel 0 is the 60th pixel up from the lower left corner).
function setOPCPixels(channel, pixels) {
	for (var i = 0; i < gOPCOrderedLights.length; i++) {
		var light = gOPCOrderedLights[i];
		var baseAddress = (i * 3);
		if (gSettings.useDeferredRenderer) {
			light.color.setRGB(
				pixels[baseAddress + 0] / 255, 
				pixels[baseAddress + 1] / 255, 
				pixels[baseAddress + 2] / 255
			);
		}
		else {
			light.material.color.setRGB(
				pixels[baseAddress + 0] / 255, 
				pixels[baseAddress + 1] / 255, 
				pixels[baseAddress + 2] / 255
			);
		}
	}
}
// @param pixels Uint8Array of bytes in physical order.
// (eg, pixel 0 is at the lower-left corner)
function setPixels(channel, pixels) {
	for (var i = 0; i < gPhysicallyOrderedLights.length; i++) {
		var light = gPhysicallyOrderedLights[i];
		var baseAddress = (light.opcAddress * 3);
		if (gSettings.useDeferredRenderer) {
			light.color.setRGB(
				pixels[baseAddress + 0] / 255, 
				pixels[baseAddress + 1] / 255, 
				pixels[baseAddress + 2] / 255
			);
		}
		else {
			light.material.color.setRGB(
				pixels[baseAddress + 0] / 255, 
				pixels[baseAddress + 1] / 255, 
				pixels[baseAddress + 2] / 255
			);
		}
	}
}

function setOPCPixel(address, color) {
	if (gSettings.useDeferredRenderer) {
		gOPCOrderedLights[address].color.setRGB(color.r, color.g, color.b);
	}
	else {
		gOPCOrderedLights[address].material.color.setRGB(color.r, color.g, color.b);	
	}
}

function setPixel(address, color) {
	if (gSettings.useDeferredRenderer) {
		gPhysicallyOrderedLights[address].color.setRGB(color.r, color.g, color.b);
	}
	else {
		gPhysicallyOrderedLights[address].material.color.setRGB(color.r, color.g, color.b);	
	}
}

function logABPattern() {
	var pixels = [];
	for (var i = 0; i < gPhysicallyOrderedLights.length; i++) {
		// Bitwise ops use two's complement representation.
		// @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators
		// So use 127 as "8-bit" chunk to avoid negative numbers, then multiply the result by 2.
		// Note that alpha bits are currently ignored.
		var level = Math.floor(((i % 60) / 60) * 127);
		if (Math.floor(i / 60) % 2 == 0) {
			pixels.push(((level << 16) | (level << 8)) * 2);
		}
		else {
			pixels.push(((level << 8) | (level << 24)) * 2);
		}
	}
	console.log(JSON.stringify(pixels));
}

function handleSuspend() {
	if (!gResetting) {
		saveSettings();
	}
}

function trigger() {
	$(gEventDispatcher).trigger.apply($(gEventDispatcher), arguments);
}

var kUdderUrl = 'http://localhost:8080';
function sendUdderCommand(path, command, onSuccess) {
	$.post(kUdderUrl + path, command, function(data, status, jqXHR) {
		if (onSuccess) {
			onSuccess(data, status, jqXHR);
		}
	});
}

if (isChromeApp()) {
	// doesn't seem to work. :(
	chrome.app.window.current().onClosed.addListener(handleSuspend);
}
else {
	$(window).on('unload', handleSuspend);
}


$(document).on('ready', function() {
	loadSettings();
	window.isReady = true;
});

// Note it seems this can be fired before the window opens so we won't get it.
$(gEventDispatcher).on('tcpListening', function(event, params) {
	$('#server-connected').text('Awaiting client connection on port ' + params.port + '.');
	console.log('tcpListening', arguments);
});

$(gEventDispatcher).on('tcpClientDisconnected', function(event, info) {
	$('#server-connected').text('Client disconnected.');
	$('.client-controls').hide();
});

$(gEventDispatcher).on('tcpAccept', function(event, info) {
	$('#server-connected').text('Client Connected on port ' + info.port);
	$('.client-controls').show();
});

$(gEventDispatcher).on('tcpAcceptError', function(event, info) {
	$('#server-connected').text('Client Not Connected');
	$('.client-controls').hide();
	$('#server-status-detail').addClass('error').text('Error: Result code ', info.resultCode);
});

$(gEventDispatcher).on('tcpListeningError', function() {
	console.log('tcpListeningError', arguments);
});

$(gEventDispatcher).on('opcFrameReport', function(event, info) {
	$('#opc-frames-received').text('Frames received: ' + info.nFrames);
});


$('#toggle-shuffle').on('click', function() {
	var $this = $(this);
	if ($this.html() == 'Shuffle Off') {
		sendUdderCommand('/mixer0/subscriber0', { state: JSON.stringify({ enabled: false }) });
		$this.html('Shuffle On');
	}
	else {
		sendUdderCommand('/mixer0/subscriber0', { state: JSON.stringify({ enabled: true }) });
		$this.html('Shuffle Off');
	}
});

$('#toggle-shuffle-speed').on('click', function() {
	var $this = $(this);
	if ($this.html() == 'Shuffle Fast') {
		sendUdderCommand('/mixer0/subscriber0', { state: JSON.stringify({ cueDurationMillis: 1000 }) });
		$this.html('Shuffle Slow');
	}
	else {
		sendUdderCommand('/mixer0/subscriber0', { state: JSON.stringify({ cueDurationMillis: 60000 }) });
		$this.html('Shuffle Fast');
	}
});
$('#restart-woven').on('click', function() {
	var $this = $(this);
	sendUdderCommand('/mixer0/layer1', { state: JSON.stringify({ level: 0.0 }) });
	setTimeout(function() {
		sendUdderCommand('/mixer0/layer1', { state: JSON.stringify({ level: 1.0 }) });
	}, 1);
	// kill other layers ... ? 
	for (var i = 2; i < 18; i++) {
		sendUdderCommand('/mixer0/layer' + i, { state: JSON.stringify({ level: 0.0 }) });
	}
});

// temp: put in a bunch of sliders for controlling levels.
/*
for (var i = 0; i < 22; i++) {
	$('#layer-level-controls').append('\
		<input type="range" min="0" max="1" value="0" step="0.1" id="layer-' + i + '-level">\
	');
	(function(layerNum) {
		$('#layer-level-controls #layer-' + i + '-level').on('change', function(event) {
			sendUdderCommand('/mixer0/layer' + layerNum, { state: JSON.stringify({ level: $(this).val() }) });
		});
	})(i);
}

$('#layer-level-controls-header').on('click', function() {
	$('#layer-level-controls').slideToggle(function() {
		if ($('#layer-level-controls:visible').length) {
			$('#layer-level-controls-header').html('[-] Layer Levels');
		}
		else {
			$('#layer-level-controls-header').html('[+] Layer Levels');
		}
	});
});
*/




// http://stackoverflow.com/questions/1985260/javascript-array-rotate
Array.prototype.rotate = (function() {
	// save references to array functions to make lookup faster
	var push = Array.prototype.push,
		splice = Array.prototype.splice;

	return function(count) {
		var len = this.length >>> 0, // convert to uint
			count = count >> 0; // convert to int

		// convert count to value in range [0, len[
		count = ((count % len) + len) % len;

		// use splice.call() instead of this.splice() to make function generic
		push.apply(this, splice.call(this, 0, count));
		return this;
	};
})();