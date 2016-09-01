// turn on woven
$.post(host + '/mixer0/layer1', {
	state: JSON.stringify({ level: 1.0 })
}, function() {
	console.log(arguments);
});


// shuffle + woven off
$.post(host + '/mixer0/subscriber0', {
	state: JSON.stringify({ enabled: true, cueDurationMillis: 10000 })
}, function() {
	console.log(arguments);
});
$.post(host + '/mixer0/layer1', {
	state: JSON.stringify({ level: 0.0 })
}, function() {
	console.log(arguments);
});



// var host = 'http://10.0.2.2:8080';
var host = 'http://10.0.2.3:8080';
//var host = 'http://127.0.0.1:8080';
var nLayers = 32;

// turn off shuffle
$.post(host + '/mixer0/subscriber0', {
	state: JSON.stringify({ enabled: false })
}, function() {
	console.log(arguments);
});

// turn on shuffle
$.post(host + '/mixer0/subscriber0', {
	state: JSON.stringify({ enabled: true, cueDurationMillis: 10000 })
}, function() {
	console.log(arguments);
});


// shuffle fast
$.post(host + '/mixer0/subscriber0', {
	state: JSON.stringify({ enabled: true, cueDurationMillis: 1000 })
}, function() {
	console.log(arguments);
});


// layer 0 off
$.post(host + '/mixer0/layer' + 0, {
	state: JSON.stringify({ level: 0.0 })
}, function() {
	console.log(arguments);
});


// blackout
for (var i = 0; i < nLayers; i++) {
	$.post(host + '/mixer0/layer' + i, {
		state: JSON.stringify({ level: 0.0 })
	}, function() {
		console.log(arguments);
	});
}

// turn on woven
$.post(host + '/mixer0/layer1', {
	state: JSON.stringify({ level: 1.0 })
}, function() {
	console.log(arguments);
});

// turn off woven
$.post(host + '/mixer0/layer1', {
	state: JSON.stringify({ level: 0.0 })
}, function() {
	console.log(arguments);
});


// magenta-gold woven
$.post(host + '/mixer0/layer1/effect', {
	state: JSON.stringify({
		"warpThreadColor": {"r": 0.8, "g": 0.00, "b": 1.00},
		"weftThreadColor": {"r": 1.00, "g": 0.66, "b": 0.00}
	})
}, function() {
	console.log(arguments);
});

// load files
var fileNames = [
	"flames.jpg",
	"flower_pedals.jpg",
	"luminous_purple_flower.jpg",
	"orange_clouds.jpg",
	"orange_green_geometry.jpg",
	"pink_yellow_orange_flowers.jpg",
	"purple_on_green_flower.jpg",
	"space_clouds.jpg",
	"trippy.jpg",
	"warm_cool_weave.jpg",
	"warped_squares.jpg",
	"water_orange.jpg",
	"white_yellow_flowers.jpg",
	"yellow_on_green_flowers.jpg"
];

for (var i = 2; i < fileNames.length + 2; i++) {
	$.post(host + '/mixer0/layer' + i + '/effect', {
		state: JSON.stringify({ fileName: fileNames[i], automatic: true })
	}, function() {
		console.log(arguments);
	});
}