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
		</style>
	</head>
	<body>
		<script src="js/underscore-min.js"></script>
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

			var container;

			var camera, scene, renderer, objects, controls;
			var dae;
			var lightRail1 = {
					group: null,
					meshes: [],
					curve: null,
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
				lightRail2 = {
					group: null,
					meshes: [],
					curve: null,
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
				};

			var loader = new THREE.ColladaLoader();
			loader.options.convertUpAxis = true;
			//loader.load( './models/sketch-model.dae', function ( collada ) {
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
							lightRail1.group = child;
							console.log('gate 1 group: ', child);
						}
						else if (child.name == 'light-rail-gate-2') {
							lightRail2.group = child;
							console.log('gate 2 group: ', child);
						}
						//console.log(child.name);
						
						if (child instanceof THREE.Mesh) {
							if (_(ancestors).any(function(name) { return name.indexOf('light-rail-gate-1') == 0; })) {
								lightRail1.meshes.push(child);
							}
							else if (_(ancestors).any(function(name) { return name.indexOf('light-rail-gate-2') == 0; })) {
								lightRail2.meshes.push(child);
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


				console.log('rail objects: ', lightRail1, lightRail2);
				
				_([lightRail1, lightRail2]).each(function(rail) {
					_(rail.meshes).each(function(mesh) {
						var sphere = new THREE.SphereGeometry(0.5, 8, 8);
						var curveSegments = [];	// will be 10 total

						// In the model, the light rails are quad strips. (Using regular line geometry didn't result in
						// correctly ordered vertices for whatever reason.) First, get only the points on the front of the
						// strips. x will be 0 (wrt their group origin).
						var lightRailPoints = _(mesh.geometry.vertices).filter(function(pt) { return pt.x == 0; });
						if (rail == lightRail1) {
							lightRailPoints.reverse();
						}

						rail.curve = new THREE.SplineCurve(_(lightRailPoints).map(function(pt) { 
							return new THREE.Vector2(pt.z, pt.y); 
						}))

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
						
						_(['top', 'bottom']).each(function(side) {
							var color = new THREE.Color(0x7788ff);
							
							var nStrips = rail.nStrips[side];
							var startU = rail.startOffsets[side];
							
							for (var i = 0; i < nStrips; i++) {
								var strip = getLightStrip(rail.curve, startU);
								for (var j = 0; j < strip.points.length; j++) {
									var l = new THREE.PointLight(color.offsetHSL(.001, 0, 0), 0.5, 40);
									//var h = new THREE.PointLightHelper(l, 1);
									var p = rail.curve.getPointAt(strip.points[j]);

									l.position = new THREE.Vector3(0, p.y, p.x).add(rail.group.position);//.add(new THREE.Vector3(-2, 0, 0));
									rail.lights.push(l);
									scene.add(l);
									//scene.add(h);
								}
								startU += strip.total;
							}
						});

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
					antialias: false } 	// doesn't work right on retina. :(
				);

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

				requestAnimationFrame( animate );

				if ( t > 1 ) t = 0;

				var railNum = 1;
				_([lightRail1, lightRail2]).each(function(rail) {
					var nLights = rail.lights.length;
					_(rail.lights).each(function(light, index) {
						var hsl = light.color.getHSL();
						var lum = 0.6 * Math.abs(Math.sin(elapsed + Math.PI * 8 * index / nLights));
						lum += 0.3 * Math.cos(elapsed * 4 + Math.PI * 12 * index / nLights);
						var hue = Math.abs(Math.sin(elapsed * (1 - index / nLights)));
						light.color.setHSL(hue, hsl.s, lum);
					});
					railNum++;
				});
				
				controls.update(delta);
				render();

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


			var kStripLength = 40.5;
			var kNLEDs = 60;
			var kLEDPitch = 0.66;
			var kInterStripOffset = 1;
			function getLightStrip(curve, startU) {
				var length = curve.getLength(),
					result = {
						points: [],
						total: 0
					},
					factor = 1 / length;

				for (var i = 0; i < kNLEDs; i++) {
					result.points.push(startU + kLEDPitch * factor * i);
				}
				result.total = kLEDPitch * factor * i + (kInterStripOffset * factor);
				
				return result;
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
