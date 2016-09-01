(function() {
	var pixels = [];
	for (var i = 0; i < gPhysicallyOrderedLights.length; i++) {
		pixels.push({
			light: gPhysicallyOrderedLights[i],
			position: gPhysicallyOrderedLights[i].position,
			history: [],
			avp: {
				r: { a: 0, v: 0, p: 0 },
				g: { a: 0, v: 0, p: 0 },
				b: { a: 0, v: 0, p: 0 }
			},
			distanceMap: []
		});
	}
})();

// at time step
	// for each pixel
		// baseColor
		// for each pixel as otherPixel
			// distance = distance to otherPixel
			// baseColor += (otherPixel offset at time now - propTime(distance)) * (1 / (distance * distance))

5*30*2280 = 342000