/**
 * Measures currently selected path, reporting at 1" = 1' scale.
 * 
 * If only some anchors/paths in the path are selected (filled arrow)
 * only reports on those segments.
 * 
 * @author Eric Miller
 */

function highestCommonFactor(a,b) {
	if (b==0) return a;
	return highestCommonFactor(b,a%b);
}

// not that useful if not rounded to nearest 8th, 16th, etc.
function getFraction(decimal) {
	var str = decimal + '',
		parts = [],
		whole, partial, factor,
		result = {
			numerator: 0,
			denominator: 1
		};
		
	if (str.indexOf('.') != -1) {
		parts = str.split('.');
		whole = parts[0];
		partial = parts[1];
		result.numerator = whole + partial;
		result.denominator = Math.pow(10, partial.length); // 100
		factor = highestCommonFactor(result.numerator, result.denominator);
		result.numerator /= factor;
		result.denominator /= factor;
	}
	return result;
}

function measurePathItem(item) {
	var lengthPts = item.length,
		lengthIn = lengthPts / 72,
		scaleLengthIn = lengthIn * 12,
		feet, inchesInDecimal, wholeInches, fractionalInches;
	
	feet = Math.floor(scaleLengthIn / 12);				// feet without inches
	wholeInches = (scaleLengthIn / 12) - feet;			// eg, 0.234
	inchesInDecimal = wholeInches = wholeInches * 12;	// # of inches in decimal
	wholeInches = Math.floor(wholeInches);
	inchesInDecimal *= 100;								// round to nearest 100th...
	inchesInDecimal = Math.round(inchesInDecimal);
	inchesInDecimal /= 100;
	//fractionalInches = getFraction(inchesInDecimal - wholeInches);
	
	alert(
		//feet + '\' ' + wholeInches + ' ' + fractionalInches.numerator + '/' + fractionalInches.denominator + '"' + "\n" + 
		feet + '\' ' + inchesInDecimal + '"' + "\n" + 
		(scaleLengthIn) + ' in' + "\n\n" + 
		'--- in document -- ' + "\n" + 
		'(' + lengthPts + ' pts' + ")\n" +
		'(' + (lengthPts / 72) + ' in)' + "\n"
	);
}

if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function (searchElement, fromIndex, eqFunc) {
		if ( this === undefined || this === null ) {
			throw new TypeError( '"this" is null or not defined' );
		}

		var length = this.length >>> 0; // Hack to convert object.length to a UInt32

		fromIndex = +fromIndex || 0;

		if (Math.abs(fromIndex) === Infinity) {
			fromIndex = 0;
		}

		if (fromIndex < 0) {
			fromIndex += length;
			if (fromIndex < 0) {
				fromIndex = 0;
			}
		}

		for (;fromIndex < length; fromIndex++) {
			if (eqFunc && eqFunc(this[fromIndex], searchElement)) {
				return fromIndex;
			}
			else if (this[fromIndex] === searchElement) {
				return fromIndex;
			}
		}

		return -1;
	};
}
function pathPtsEqual(pt1, pt2) {
	return (pt1.anchor[0] == pt2.anchor[0] && pt1.anchor[1] == pt2.anchor[1]);
}

var doc = activeDocument;
// var selection = doc.selection[0];	// doesn't like this. :(
	
if (doc.selection[0].typename == 'PathItem') {
	if (doc.selection[0].selectedPathPoints.length != doc.selection[0].pathPoints.length) {
		var dupe = doc.selection[0].duplicate(),
			indicesToRemove = [],
			pointsToRemove = [],
			i;

		for (i = 0; i < doc.selection[0].pathPoints.length; i++) {
			if (doc.selection[0].selectedPathPoints.indexOf(doc.selection[0].pathPoints[i], 0, pathPtsEqual) != -1) {
				indicesToRemove.push(i);
			}
		}

		for (i = 0; i < dupe.pathPoints.length; i++) {
			if (indicesToRemove.indexOf(i) == -1) {
				pointsToRemove.push(dupe.pathPoints[i]);
			}
		}

		for (i = 0; i < pointsToRemove.length; i++) {
			pointsToRemove[i].remove();
		}
		measurePathItem(dupe);
		dupe.remove();
	}
	else {
		measurePathItem(doc.selection[0]);
	}
}