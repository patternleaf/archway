(function() {
	var driverNames = [], i, n, opcAddress;

	// G1
	for (i = 0; i < 9; i++) {
		driverNames.push('G1-' + i);
	}
	
	// G2
	for (i = 0; i < 10; i++) {
		driverNames.push('G2-' + i);
	}
	
	var driverMap = {};
	
	// G1-0 through G1-3
	for (var opcAddress = 0, n = 0; opcAddress < 480; opcAddress += 120, n++) {
		driverMap[driverNames[n]] = {
			a: { start: opcAddress, end: opcAddress + 59 },
			b: { start: opcAddress + 60, end: opcAddress + 119 }
		};
	}
	
	// G1-4 through G1-7
	for (opcAddress = 600; opcAddress < 1080; opcAddress += 120, n++) {
		driverMap[driverNames[n]] = {
			a: { start: opcAddress, end: opcAddress + 59 },
			b: { start: opcAddress + 60, end: opcAddress + 119 }
		};
	}
	
	// G1-8
	driverMap[driverNames[n]] = {
		a: { start: 480, end: 539 },
		b: { start: 540, end: 599 }
	};
	
	// G2-0 through G2-9
	for (opcAddress = 1080; opcAddress < 2280; opcAddress += 120, n++) {
		driverMap[driverNames[n]] = {
			a: { start: opcAddress, end: opcAddress + 59 },
			b: { start: opcAddress + 60, end: opcAddress + 119 }
		};
	}

	function sendDriverOn(driverName) {
		console.log('driver on ', driverName);
		$.post({
			url: '/gateway',
			data: {
				start: driverMap[driverName].a.start,
				end: driverMap[driverName].b.end
			}
		});
	}
	
	function sendAllOff() {
		console.log('posting to');
		$.post({
			url: '/gateway/kill-all',
			data: {
				dummy: 'blah'
			}
		});
	}

	$(document).ready(function() {
		
		driverNames.forEach(function(driverName) {
			$('#driver-radio-buttons').append(
				'<label>' + driverName + 
				'<input type="radio" name="active-driver" data-driver-name="' + driverName + '">' +
				'</label>\n'
			);
		});
		
		$('input[name=active-driver]').on('change', function() {
			var $input = $('input[name=active-driver]:checked'),
				driverName = $input.data('driver-name');
			sendDriverOn(driverName)
		});
		
		$('button[name=kill-all]').on('click', function() {
			sendAllOff();
			$('input[name=active-driver]:checked').prop('checked', false);
			return false;
		});
	});

})();
