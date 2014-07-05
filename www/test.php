<!DOCTYPE html>
<html lang="en">
	<head>
		<title>three.js webgl - collada</title>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
		<style>
			body {
				font-family: Monospace;
				background-color: #000000;
				margin: 0px;
				overflow: hidden;
			}

			#info {
				color: #fff;
				position: absolute;
				top: 10px;
				width: 100%;
				text-align: center;
				z-index: 100;
				display:block;

			}

			a { color: skyblue }
			
			#controls {
				position:absolute;
				left:1em;
				bottom:1em;
				color:#ddd;
				font-size:12px;
				font-family:Helvetica, sans-serif;
				width: 250px;
				background:rgba(255, 255, 255, 0.2);
				border-radius:0.5em;
				padding:0.5em;
			}
			
			#controls h1 {
				margin-top:1.5em;
				font-size:14px;

			}
			#controls h1:first-child {
				margin-top:0;
			}
			#controls h2 {
				font-size:12px;
				margin:0.25em;
			}
			#controls input[type=number] {
				width:50px;
			}
			#controls .n-strips {
				color:#aaa;
			}
			
			#controls #toggle-play {
				float:right;
			}
			
			#opc-modal {
				display:none;
				position:absolute;
				left:2em;
				right:2em;
				top:2em;
				bottom:2em;
				background-color:rgba(0, 0, 0, 0.5);
				padding:2em;
			}
			
			#opc-code {
				background-color:rgba(200, 200, 200, 1);
				color:#333;
				font-family:courier, monospace;
				white-space:pre;
				margin-top:2em;
				width:100%;
				height:100%;
			}
			
			#opc-close-button {
				color:#fff;
				position:absolute;
				right:1em;
				top:1em;
				font-size:2em;
				cursor:pointer;
			}
			
			#opc-close-button:hover {
				color:#8f8;
			}
			
		</style>
	</head>
	<body>
		
		<div id="controls">
			<button id="toggle-play">Pause</button>
			<form>
				<h1>Gate 1</h1>
				<h2>Start - Top <span class="n-strips" id="gate-1-top-n-strips"></span></h2>
				<input type="range" id="gate-1-top-start-slider" min="0" max="1" value="0.14" step="0.0001">
				<input type="number" id="gate-1-top-start-number" step="0.1"> in
				
				<h2>Start - Bottom <span class="n-strips" id="gate-1-bottom-n-strips"></span></h2>
				<input type="range" id="gate-1-bottom-start-slider" min="0" max="1" value="0.65" step="0.0001">
				<input type="number" id="gate-1-bottom-start-number" step="0.1"> in
				
				<h1>Gate 2</h1>
				<h2>Start - Top <span class="n-strips" id="gate-2-top-n-strips"></span></h2>
				<input type="range" id="gate-2-top-start-slider" min="0" max="1" value="0.13" step="0.0001">
				<input type="number" id="gate-2-top-start-number" step="0.1"> in
				
				<h2>Start - Bottom <span class="n-strips" id="gate-2-bottom-n-strips"></span></h2>
				<input type="range" id="gate-2-bottom-start-slider" min="0" max="1" value="0.7" step="0.0001">
				<input type="number" id="gate-2-bottom-start-number" step="0.1"> in
			</form>
			<button id="generate-opc-layout">Generate OPC Layout</button>
		</div>
		
		<div id="opc-modal">
			<div id="opc-close-button">x</div>
			<textarea id="opc-code"></textarea>
		</div>
		
		<script src="js/underscore-min.js"></script>
		<script src="js/jquery-2.1.1.min.js"></script>
		<script src="js/three/three.min.js"></script>
		<script src="js/three/loaders/ColladaLoader.js"></script>
		<script src="js/three/renderers/WebGLDeferredRenderer.js"></script>
		<script src="js/three/ShaderDeferred.js"></script>
		<script src="js/three/FXAAShader.js"></script>
		<script src="js/three/ShaderPass.js"></script>
		<script src="js/three/MaskPass.js"></script>
		<script src="js/three/RenderPass.js"></script>
		<script src="js/three/CopyShader.js"></script>
		<script src="js/three/postprocessing/EffectComposer.js"></script>
		<script src="js/three/controls/FirstPersonControls.js"></script>

		<script>

			// LED strip parameters
			var kStripLength = 40.5;
			var kNLightsPerStrip = 60;
			var kLEDPitch = 0.66;
			var kInterStripOffset = 1;

			var container;

			var camera, scene, renderer, objects, controls;
			var dae;
			var gLightRail1 = {
					group: null,
					meshes: [],
					curve: null,
					totalLength: 0,
					nStrips: {
						top: 7,
						bottom: 5
					},
					startOffsets: {
						top: 0.14,
						bottom: 0.65
					},
					strips: [],
					lights: []
				}, 
				gLightRail2 = {
					group: null,
					meshes: [],
					curve: null,
					totalLength: 0,
					nStrips: {
						top: 9,
						bottom: 4
					},
					startOffsets: {
						top: 0.13,
						bottom: 0.7
					},
					strips: [],
					lights: []
				},
				gOPCPointList = [],
				gOPCMaxPointValue = 0;

			var gAnimating = true;

			var loader = new THREE.ColladaLoader();
			loader.options.convertUpAxis = true;
			loader.load( './models/model-wip.dae', function ( collada ) {

				dae = collada.scene;

				dae.scale.x = dae.scale.y = dae.scale.z = 1;
				dae.updateMatrix();
				
				modifyModelMesh(dae, 'root');

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
				camera.position.set( 200, 100, -200 );
				
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
				
				_([gLightRail1, gLightRail2]).each(function(rail) {
					_(rail.meshes).each(function(mesh) {
						var sphere = new THREE.SphereGeometry(0.5, 8, 8);
						var curveSegments = [];	// will be 10 total

						// In the model, the light rails are quad strips. (Using regular line geometry didn't result in
						// correctly ordered vertices for whatever reason.) First, get only the points on the front of the
						// strips. x will be 0 (wrt their group origin).
						var lightRailPoints = _(mesh.geometry.vertices).filter(function(pt) { return pt.x == 0; });
						if (rail == gLightRail1) {
							lightRailPoints.reverse();
						}

						rail.curve = new THREE.SplineCurve(_(lightRailPoints).map(function(pt) { 
							return new THREE.Vector2(pt.z, pt.y); 
						}))
						
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
						createLightsForRail(rail);
					});
				});


				// Lights

				scene.add( new THREE.AmbientLight( 0xcccccc ) );

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

				//renderer = new THREE.WebGLRenderer();

				renderer = new THREE.WebGLDeferredRenderer({ 
					width: window.innerWidth, 
					height: window.innerHeight, 
					scale: 1, 
					antialias: false 	// doesn't work right on retina. :(
				});

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
				controls.lon = -180;


				scene.add(new THREE.AxisHelper(120));

				window.addEventListener( 'resize', onWindowResize, false );
				
				/*
				console.log(gOPCMaxPointValue);
				console.log(JSON.stringify(_(gOPCPointList).map(
					function(pt) { return { point: [pt.point[0] / gOPCMaxPointValue, pt.point[1] / gOPCMaxPointValue, pt.point[2] / gOPCMaxPointValue ] }; }
				)));
				*/
				
				$('#gate-1-top-start-number, #gate-1-bottom-start-number').attr('min', 0);
				$('#gate-1-top-start-number, #gate-1-bottom-start-number').attr('max', gLightRail1.totalLength);

				$('#gate-2-top-start-number, #gate-2-bottom-start-number').attr('min', 0);
				$('#gate-2-top-start-number, #gate-2-bottom-start-number').attr('max', gLightRail2.totalLength);

				$('#gate-1-top-n-strips').html(gLightRail1.nStrips.top + ' strips');
				$('#gate-1-bottom-n-strips').html(gLightRail1.nStrips.bottom + ' strips');
				$('#gate-2-top-n-strips').html(gLightRail2.nStrips.top + ' strips');
				$('#gate-2-bottom-n-strips').html(gLightRail2.nStrips.bottom + ' strips');
				
				updateNumericValues();
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

				var railNum = 1;
				_([gLightRail1, gLightRail2]).each(function(rail) {
					var nLights = rail.lights.length;
					_(rail.lights).each(function(light, index) {
						var hsl = light.color.getHSL();
						var lum = 0.8 * Math.abs(Math.sin(elapsed + Math.PI * 8 * index / nLights));
						var hue = Math.abs(Math.sin(elapsed / 12 * (1 - index / nLights)));
						light.color.setHSL(hue, 1.0, lum);
					});
					railNum++;
				});
				
				controls.update(delta);
				render();

				if (gAnimating) {
					requestAnimationFrame( animate );
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
					result.points.push(startU + kLEDPitch * factor * i);
				}
				result.total = kLEDPitch * factor * i + (kInterStripOffset * factor);
				
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
			
			function createLightsForRail(rail) {
				_(['top', 'bottom']).each(function(side) {
					var color = new THREE.Color(0x7788ff);
					
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
							gOPCPointList.push({ point: [l.position.x, l.position.y, l.position.z] });
							var max = _([l.position.x, l.position.y, l.position.z]).max();
							if (max > gOPCMaxPointValue) {
								gOPCMaxPointValue = max;
							}
							scene.add(l);
							//scene.add(h);
						}
						startU += strip.total;
					}
				});
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
			
			$('#generate-opc-layout').on('click', function() {
				showOPC(generateOPCLayout());
			});
			
			$('#opc-close-button').on('click', function() {
				$('#opc-modal').hide();
			});
			
			function showOPC(code) {
				$('#opc-code').html(code);
				$('#opc-modal').show();
			}
			
			function generateOPCLayout() {
				return JSON.stringify(_(gOPCPointList).map(
					function(pt) { 
						return { 
							point: [pt.point[0] / gOPCMaxPointValue, pt.point[1] / gOPCMaxPointValue, pt.point[2] / gOPCMaxPointValue ] 
						}; 
					}
				));
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
			
		</script>
	</body>
</html>
