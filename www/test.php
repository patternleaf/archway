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
		<script src="js/three/three.min.js"></script>
		<script src="js/three/loaders/ColladaLoader.js"></script>
		<script src="js/three/controls/EditorControls.js"></script>
		<script src="js/three/controls/FirstPersonControls.js"></script>

		<script>

			var container;

			var camera, scene, renderer, objects, controls;
			var particleLight, pointLight;
			var dae;

			var loader = new THREE.ColladaLoader();
			loader.options.convertUpAxis = true;
			loader.load( './models/sketch-model.dae', function ( collada ) {

				dae = collada.scene;

				dae.scale.x = dae.scale.y = dae.scale.z = 0.002;
				dae.updateMatrix();

				init();
				animate();

			} );

			function init() {

				container = document.createElement( 'div' );
				document.body.appendChild( container );

				camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 2000 );
				camera.position.set( 1, 1, 1 );

				scene = new THREE.Scene();

				// Grid

				var size = 14, step = 1;

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

				// Add the COLLADA

				scene.add( dae );

				particleLight = new THREE.Mesh( new THREE.SphereGeometry( 4, 8, 8 ), new THREE.MeshBasicMaterial( { color: 0xffffff } ) );
				particleLight.position.x = 100;
				particleLight.position.y = 20000;
				particleLight.position.z = 100;
//				scene.add( particleLight );

				// Lights

				scene.add( new THREE.AmbientLight( 0xcccccc ) );

				var directionalLight = new THREE.DirectionalLight(/*Math.random() * 0xffffff*/0x555544 );
				var directionalLight2 = new THREE.DirectionalLight(/*Math.random() * 0xffffff*/0x444466 );
				directionalLight.position.x = 0;
				directionalLight.position.y = 10;
				directionalLight.position.z = 10;
				directionalLight.position.normalize();
				directionalLight.castShadow = true;
				directionalLight.shadowCameraLeft = -10;
				directionalLight.shadowCameraRight = 10;
				directionalLight.shadowCameraTop = 10;
				directionalLight.shadowCameraBottom = -10;
				directionalLight.shadowBias = 0.0001;
				directionalLight.shadowDarkness = 0.5;
				directionalLight.shadowMapWidth = 2048;//SHADOW_MAP_WIDTH;
				directionalLight.shadowMapHeight = 2048;//SHADOW_MAP_HEIGHT;
				
				directionalLight2.position.x = 100;
				directionalLight2.position.y = 300;
				directionalLight2.position.z = 20;
				directionalLight2.position.normalize();
				directionalLight2
				
				scene.add(directionalLight);
				scene.add(directionalLight2);
				
				// pointLight = new THREE.PointLight( 0xdddddd, 4 );
				// pointLight.position = particleLight.position;
				// scene.add( pointLight );

				renderer = new THREE.WebGLRenderer();
				renderer.setSize( window.innerWidth, window.innerHeight );
				renderer.shadowMapEnabled = true;
				renderer.shadowMapType = THREE.PCFShadowMap;

				container.appendChild( renderer.domElement );

				controls = new THREE.EditorControls(camera, renderer.domElement);
				controls.center = new THREE.Vector3( 0.5, 0.5, 0.5 );
				camera.lookAt(new THREE.Vector3( 0.5, 0.5, 0.5 ));
				//

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

				requestAnimationFrame( animate );

				if ( t > 1 ) t = 0;
				//controls.update(delta);
				render();

			}

			function render() {

				var timer = Date.now() * 0.0005;

				// camera.position.x = Math.cos( timer ) * 10;
				// camera.position.y = 2;
				// camera.position.z = Math.sin( timer ) * 10;

				camera.lookAt( scene.position );

				// particleLight.position.x = Math.sin( timer * 4 ) * 3009;
				// particleLight.position.y = Math.cos( timer * 5 ) * 4000;
				// particleLight.position.z = Math.cos( timer * 4 ) * 3009;

				renderer.render( scene, camera );

			}

		</script>
	</body>
</html>
