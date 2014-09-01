console.log(docCookies.getItem('archway-settings'));
var gSettings = docCookies.hasItem('archway-settings') ? JSON.parse(docCookies.getItem('archway-settings')) : {
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

var gResetting = false;
$(window).on('unload', function() {
	if (!gResetting) {
		docCookies.setItem('archway-settings', JSON.stringify(gSettings));
	}
});

// LED strip parameters
// strips come in pairs with a box between them
var kStripLength = 39.5;
var kNLightsPerStrip = 60;
var kLEDPitch = 0.66;
var kInterStripOffset = 2;

var container;

var camera, scene, renderer, objects, controls;
var dae;
var gLightRail1 = {
		group: null,
		meshes: [],
		curve: null,
		totalLength: 0,
		stripPairOffsets: [
			// roughly .097 is one strip pair length
			0.101,
			0.2,
			0.297,
			0.394,
			0.61,
			0.707,
			0.804,
			//0.901
			0.887
		],
		strips: [],
		lights: []
	}, 
	gLightRail2 = {
		group: null,
		meshes: [],
		curve: null,
		totalLength: 0,
		stripPairOffsets: [
			// rougly .083 is one strip pair length
			0.096,
			0.18,
			0.263,
			0.346,
			0.429,
			//0.512,
			0.515,
			0.653,
			0.736,
			0.819,
			0.904
		],
		strips: [],
		lights: []
	},
	gOPCPointList = [],
	gOPCMaxPointValue = 0;

var gAnimating = true;

var loader = new THREE.ColladaLoader();
loader.options.convertUpAxis = true;
loader.load( 'models/model-wip.dae', function ( collada ) {

	dae = collada.scene;

	dae.scale.x = dae.scale.y = dae.scale.z = 1;
	dae.updateMatrix();
	
	modifyModelMesh(dae, 'root');

	$('#loading-model-indicator').fadeOut();

	init();
	animate();

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

	// Grid
/*
	var size = 120, step = 12;

	var geometry = new THREE.Geometry();
	var material = new THREE.LineBasicMaterial( { color: 0x303030 } );

	for ( var i = - size; i <= size; i += step ) {

		geometry.vertices.push( new THREE.Vector3( - size, - 0.04, i ) );
		geometry.vertices.push( new THREE.Vector3(   size, - 0.04, i ) );

		geometry.vertices.push( new THREE.Vector3( i, - 0.04, - size ) );
		geometry.vertices.push( new THREE.Vector3( i, - 0.04,   size ) );

	}

	var line = new THREE.Line( geometry, material, THREE.LinePieces );
	scene.add( line );
*/
	// Add the COLLADA

	scene.add( dae );


	//console.log('rail objects: ', gLightRail1, gLightRail2);
	
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
		});
		
	});
	
	console.log((gLightRail1.lights.length + gLightRail2.lights.length) + ' lights total');


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

var t = 0;
var clock = new THREE.Clock();

function animate() {

	var delta = clock.getDelta();
	var elapsed = clock.getElapsedTime();
	elapsed = elapsed % (Math.PI * 2);
	
	if ( t > 1 ) t = 0;
	
	/*
	var railNum = 1;
	_([gLightRail1, gLightRail2]).each(function(rail) {
		var nLights = rail.lights.length;
		_(rail.lights).each(function(light, index) {
			var hsl, lum, hue;
			if (gSettings.useDeferredRenderer) {
				hsl = light.color.getHSL();
			}
			else {
				hsl = light.material.color.getHSL();
			}
			lum = 0.8 * Math.abs(Math.sin(elapsed + Math.PI * 8 * index / nLights));
			hue = Math.abs(Math.sin(elapsed / 12 * (1 - index / nLights)));
			if (gSettings.useDeferredRenderer) {
				light.color.setHSL(hue, 1.0, lum);
			}
			else {
				light.material.color.setHSL(hue, 1.0, lum);
			}

		});
		railNum++;
	});
	*/
	
	controls.update(delta);
	render();

	if (gAnimating) {
		requestAnimationFrame( animate );
	}

	gSettings.camera.position = camera.position;
	gSettings.controls.lat = controls.lat;
	gSettings.controls.lon = controls.lon;
	gSettings.controls.phi = controls.phi;
	gSettings.controls.theta = controls.theta;
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
		result.points.push(startU + kLEDPitch * factor * i);
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
		result.points.up.push(centerU + (kInterStripOffset / 2 * factor) + i * kLEDPitch * factor);
	}
	
	result.endpoints.up.push(result.points[0]);
	result.endpoints.up.push(result.points[result.points.length - 1]);
	
	for (i = 0; i < kNLightsPerStrip; i++) {
		result.points.down.push(centerU - (kInterStripOffset / 2 * factor) - i * kLEDPitch * factor);
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
		$(this).text('Pause');
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
/*
function updateNumericValues() {
	$('#gate-1-top-start-number').val(
		getInches(gLightRail1.totalLength, $('#gate-1-top-start-slider').val()).toFixed(1)
	);
	$('#gate-1-bottom-start-number').val(
		getInches(gLightRail1.totalLength, $('#gate-1-bottom-start-slider').val()).toFixed(1)
	);
	$('#gate-2-top-start-number').val(
		getInches(gLightRail2.totalLength, $('#gate-2-top-start-slider').val()).toFixed(1)
	);
	$('#gate-2-bottom-start-number').val(
		getInches(gLightRail2.totalLength, $('#gate-2-bottom-start-slider').val()).toFixed(1)
	);
}

function updateLayout() {
	gLightRail1.startOffsets.top = parseFloat($('#gate-1-top-start-slider').val());
	gLightRail1.startOffsets.bottom = parseFloat($('#gate-1-bottom-start-slider').val());

	gLightRail2.startOffsets.top = parseFloat($('#gate-2-top-start-slider').val());
	gLightRail2.startOffsets.bottom = parseFloat($('#gate-2-bottom-start-slider').val());
	updateLightPositions();
}

function updateLightPositions() {
	gOPCPointList = [];
	_([gLightRail1, gLightRail2]).each(function(rail, railNum) {
		var lightIndex = 0;
		_(['top', 'bottom']).each(function(side) {
			var nStrips = rail.nStrips[side];
			var startU = rail.startOffsets[side];
			var strip, light;
			var p, max;
		
			for (var i = 0; i < nStrips; i++) {
				//console.log('gate ' + (railNum + 1) + ', ' + side + ' strip ' + (i + 1), startU);
				strip = getLightStrip(rail.totalLength, startU);
				for (var j = 0; j < strip.points.length; j++) {
					p = rail.curve.getPointAt(strip.points[j]);
					light = rail.lights[lightIndex];
					light.position = new THREE.Vector3(0, p.y, p.x).add(rail.group.position);
					gOPCPointList.push({ point: [light.position.x, light.position.y, light.position.z] });
					max = _([light.position.x, light.position.y, light.position.z]).max();
					if (max > gOPCMaxPointValue) {
						gOPCMaxPointValue = max;
					}

					lightIndex++;
				}
				
				startU += strip.total;
			}
		});
	});
}
*/
function createLightsForRail(rail, railIndex) {
	var color = new THREE.Color(0x7788ff);

	_(rail.stripPairOffsets).each(function(stripPairOffset) {

		var boxGeometry = new THREE.BoxGeometry(1, 1, 1);
		var boxMesh = new THREE.Mesh(boxGeometry, new THREE.MeshBasicMaterial({ color: 0x777777 }));
		var boxParametricPos = rail.curve.getPointAt(stripPairOffset);
		boxMesh.position = new THREE.Vector3(0, boxParametricPos.y, boxParametricPos.x).add(rail.group.position);
		scene.add(boxMesh);
	
		var pair = getStripPair(stripPairOffset, rail.totalLength);
	
		_(['up', 'down']).each(function(stripName) {
			var stripCurvePts = [];
			for (var i = 0; i < pair.points[stripName].length; i++) {
				var l;
				if (gSettings.useDeferredRenderer) {
					l = new THREE.PointLight(color.offsetHSL(.001, 0, 0), 0.5, 60);
				}
				else {
					l = new THREE.Mesh(
						new THREE.SphereGeometry(0.5, 4, 4), 
						new THREE.MeshBasicMaterial({ color: color.offsetHSL(.001, 0, 0) })
					);
				}
			
				var ledPoint = rail.curve.getPointAt(pair.points[stripName][i]);
		
				l.position = new THREE.Vector3(0, ledPoint.y, ledPoint.x).add(rail.group.position);//.add(new THREE.Vector3(-2, 0, 0));
				stripCurvePts.push(l.position.clone());
				rail.lights.push(l);
		
				gOPCPointList.push({ 
					point: [l.position.x, l.position.y, l.position.z],
					gate: railIndex
				});
		
				var max = _([l.position.x, l.position.y, l.position.z]).max();
				if (max > gOPCMaxPointValue) {
					gOPCMaxPointValue = max;
				}
				scene.add(l);
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




	/*
	var nStrips = rail.nStrips[side];
	var startU = rail.startOffsets[side];

	for (var i = 0; i < nStrips; i++) {
		var strip = getLightStrip(rail.totalLength, startU);
		for (var j = 0; j < strip.points.length; j++) {
			var l = new THREE.PointLight(color.offsetHSL(.001, 0, 0), 0.5, 60);
			//var h = new THREE.PointLightHelper(l, 1);
			var p = rail.curve.getPointAt(strip.points[j]);

			l.position = new THREE.Vector3(0, p.y, p.x).add(rail.group.position);//.add(new THREE.Vector3(-2, 0, 0));
			rail.lights.push(l);
			gOPCPointList.push({ 
				point: [l.position.x, l.position.y, l.position.z],
				gate: railIndex
			});
			var max = _([l.position.x, l.position.y, l.position.z]).max();
			if (max > gOPCMaxPointValue) {
				gOPCMaxPointValue = max;
			}
			scene.add(l);
			//scene.add(h);
		}
		startU += strip.total;
	}
	*/
}

$('form input[type="range"]').on('change', function() {
	updateNumericValues()
	updateLayout();
});

$('form input[type="number"]').on('change', function() {
	var floatVal = parseFloat($(this).val());
	var floatMax = parseFloat($(this).attr('max'));
	if (floatVal <= floatMax && floatVal >= 0) {
		$('#' + $(this).attr('id').replace('number', 'slider')).val(floatVal / floatMax);
	}
	updateNumericValues();
	updateLayout();
});

$('#show-opc-layout').on('click', function() {
	showOPC(showOPCLayout());
});

$('#opc-close-button').on('click', function() {
	$('#opc-modal').hide();
});

if (gSettings.useDeferredRenderer) {
	$('#switch-renderers')
		.text('Reload with WebGL Renderer')
		.on('click', function() {
			gSettings.useDeferredRenderer = false;
			reloadSim();
		});
}
else {
	$('#switch-renderers')
		.text('Reload with Deferred Renderer')
		.on('click', function() {
			gSettings.useDeferredRenderer = true;
			reloadSim();
		});
}
$('#reset').on('click', function() {
	docCookies.removeItem('archway-settings');
	gResetting = true;
	reloadSim();
});


function showOPC(code) {
	$('#opc-code').html(code);
	$('#opc-modal').show();
}

function showOPCLayout() {
	return JSON.stringify(_(gOPCPointList).map(
		function(pt) { 
			return { 
				point: [pt.point[0] / gOPCMaxPointValue, pt.point[1] / gOPCMaxPointValue, pt.point[2] / gOPCMaxPointValue ],
				gate: pt.gate 
			}; 
		}
	));
}

function reloadSim() {
	if (chrome && ('runtime' in chrome)) {
		chrome.runtime.reload();
	}
	else {
		window.location = window.location;
	}
}

if (chrome && _(chrome).has('runtime')) {
	chrome.runtime.onMessage.addListener(function(message, sender) {
		setPixels(message.channel, message.pixels);
	});
}

function setPixels(channel, pixels) {
	var railNum = 1;
	var colorIndex = 0;

	_([gLightRail1, gLightRail2]).each(function(rail) {
		var nLights = rail.lights.length;
		_(rail.lights).each(function(light, index) {
			if (colorIndex < pixels.length - 1) {
				if (gSettings.useDeferredRenderer) {
					light.color.setRGB(pixels[colorIndex + 0], pixels[colorIndex + 1], pixels[colorIndex + 2]);
				}
				else {
					light.material.color.setRGB(pixels[colorIndex + 0], pixels[colorIndex + 1], pixels[colorIndex + 2]);
				}
			}
			colorIndex += 3;
		});
		railNum++;
	});
}


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
