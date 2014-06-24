// AddVertex-max_length.js

// divides each selected segment into several smaller segments, based on a
// specified maximum length. The length of each segment in each divided segment
// is equal. All generated segments are shorter than the maximum length.

// JavaScript Script for Adobe Illustrator
// This script provided "as is" without warranty of any kind.
// Free to use and distribute.

// Most parts of the code are taken from "Divide (length)" script by SATO 
// Hiroyuki (2006-2009), http://park12.wakwak.com/~shp/lc/et/en_aics_script.html 
// Slight modification of elementary code were made by Bojan Savric (2012), 
// Cartography and Geovisualization Group at Oregon State University.


var ver10 = (version.indexOf('10') == 0);

main();
function main(){
  var pathes = [];
  getPathItemsInSelection(n, pathes);
  if(pathes.length < 1) {
  	alert("Please select at least two successive anchor points or a whole path.");
  	return;
  }


  // Settings ====================

  var max = 10; // default dividing number
  
  // =============================
  // not ver.10 : input a number with a prompt box
  if(! ver10){
    max = prompt("Define the maximum allowed distance between vertices\n(in millimeters):", max);
    if(! max){
      return;
    } else if(isNaN(max) || max < 0.1){
      alert("Wrong input. Please input a number greater than 0.1 mm and use a decimal point.");
	  return;
    }
    max = parseFloat(max)*72/25.4;
  }
    
    var i, j, h, p, q, alertN;
     
	//Checking the number of devisions
	alertN = 0; 
	loop:
	for ( h = 0; h < pathes.length; h++) {
		p = pathes[h].pathPoints;
		for ( i = 0; i < p.length; i++) {
			j = parseIdx(p, i + 1);
			if (j < 0)
				break;
			if (! sideSelection(p[i], p[j]))
				continue;
			//q = [p[i].anchor, p[i].rightDirection, p[j].leftDirection, p[j].anchor];
			//alertN += getT4Len(q, 0);
			alertN += distance(p[i].anchor, p[j].anchor)
			if (alertN/max > 1000) {
				if (confirm("More than 1000 vertices will be added and that may take some time. Do you want to continue anyway?"))
					break loop;
				else
					return;
			}
		}
	}

  //adding new vertices
  var i, j, k, n, l, count;
  var pnts, len, ar, redrawflg, anchorLack, anyRedraw;
  anchorLack = anyRedraw = false;
  
  for(h = 0; h < pathes.length; h++){
    redrawflg = false;
    count = 0;
    pnts = [];
    p = pathes[h].pathPoints;
    
    for(i = 0; i < p.length; i++){
      j = parseIdx(p, i + 1);
      if(j < 0) break;
      
      //Handling when there is only one anchor points in the row are selected
      l = parseIdx(p, i - 1); 
      if (l<0) l = j;
      anchorLack = anchorLack || oneSelection(p[l], p[i], p[j]);
      //if (j == p.length-1) anchorLack = anchorLack || oneSelection(p[i], p[j], p[i]);
      
      if(! sideSelection(p[i], p[j])) continue;
      
      ar = [i];
      q = [p[i].anchor, p[i].rightDirection,
           p[j].leftDirection, p[j].anchor];
      
      //defining a number of new segments
      n = Math.floor(getT4Len(q, 0)/ max) + 1;
      
      len = getT4Len(q, 0) / n;
      if(len <= 0) continue;

      redrawflg = true;

      for(k = 1; k < n; k++){
        ar.push( getT4Len(q, len * k) );
      }
      pnts.push(ar);
      count++; 
      anyRedraw = true;
    }
    //Handling when less that two anchor points in the row are selected
    if (count < 1){
    	anchorLack = true;    	
    }
    count = 0;
    
    if(redrawflg) addPnts(pathes[h], pnts, false);

	//Handling some special cases when selection is lost
    pathes[h].selected = true;
  }
  activeDocument.selection = pathes;
  
  //Alert when there is a path with less than two selected anchor points in the row
  if (anchorLack == true && !anyRedraw) alert("Less than two successive anchor points were selected. Please select at least two successive anchor points or a whole path.", "Warning");
  if (anchorLack == true && anyRedraw) alert("There was at least one path with less than two successive anchor points selected. Vertices have been added to all other selected paths.", "Warning");
}

// ----------------------------------------------
// addPnts: adds anchors to pathitem "pi"
// an example of usage:
/* var pi=activeDocument.selection[0];
var pnts = [ [0,  0.3,0.8,0.5],
             [3,  0.5] ];  // [ [i, t,t,t,t...],[i, t,t..
addPnts(pi,pnts,true);
 */
function addPnts(pi, pnts, need2sort){ // target pathItem, list, need to sort the parameters
  // pnts = [ [index,  t,t,t,t...],[index,  t,t..
  // items must be ordered by index
  // an item without t ([index]) is acceptable.  an empty allay is not acceptable.
  // an index out of bounds is acceptable.  the range of t is 0 < t < 1.
  var p = pi.pathPoints;
  var pnts2 = [];
  var adjNextLDir  = 0;
  var adjFirstLDir = 0;
  var idx = (pi.closed && pnts[pnts.length-1][0] == p.length - 1) ? 0 : pnts[0][0];
  var ar = pnts.shift();
  var nidx = ar.shift();
  var j, pnt, q;
  
  for(var i = idx; i < p.length; i++){
    pnts2.push( getDat(p[i]) );
    if(adjNextLDir > 0){
      pnts2[pnts2.length-1][2] = adjHanP(p[i],0,1-adjNextLDir);
    }
    if(nidx == i){
      if(ar.length > 0){
        if(need2sort){
          ar.sort();
          ar = getUniq(ar);
        }
        if(i == p.length - 1 && idx == 0){
          adjFirstLDir = ar[ar.length-1];
        }
        pnts2[pnts2.length - 1][1] = adjHanP(p[i], 1, ar[0]),
        ar.unshift(0);
        ar.push(1);
        nxi = parseIdx(p,i + 1);
        if(nxi < 0) break;
        q = [p[i].anchor, p[i].rightDirection,
             p[nxi].leftDirection, p[nxi].anchor];
        if(arrEq(q[0], q[1]) && arrEq(q[2], q[3])){
          for(j = 1; j < ar.length - 1; j++){
            pnt = bezier(q, ar[j]);
            pnts2.push( [pnt, pnt, pnt, PointType.CORNER] );
          }
        } else {
          for(j = 1; j < ar.length - 1; j++){
            pnts2.push( getDivPnt(q, ar[j-1], ar[j], ar[j+1]) );
          }
        }
         adjNextLDir = ar[ar.length - 2];
      } else {
        adjNextLDir = 0;
      }
      if(pnts.length > 0){
        ar = pnts.shift();
        nidx = ar.shift();
      }
    } else {
      adjNextLDir = 0;
    }
  }

  if(adjFirstLDir > 0) pnts2[0][2] = adjHanP(p[0], 0, 1 - adjFirstLDir);
  //alert("poti" + pi + "izbira" + activeDocument.selection);
  if(pnts2.length > 0) applyData2AfterIdx(p, pnts2, idx - 1);
  pnts2.selected = true;
  //alert("poti" + pi + "izbira" + activeDocument.selection);
}
// ----------------------------------------------
function getUniq(ar){ // Array (sorted)
  if(ar.length < 2) return ar;
  var ar2 = [ ar[0] ];
  var torelance = 0.01;
  for(var i = 1; i < ar.length; i++){
    if(ar[i] - ar2[ ar2.length - 1 ] > torelance) ar2[ar2.length] = ar[i];
  }
  return ar2;
}
// ----------------------------------------------
// returns an array for properties of a pathpoint
function getDat(p){ // pathPoint
  with(p) return [anchor, rightDirection, leftDirection, pointType];
}
// ----------------------------------------------
// magnifies a handle by m
function adjHanP(p, n, m){ // p=pathpoint, n=0:leftDir, n=1:rightDir, m=magnification rate
  with(p){
    var d = (n == 1 ? rightDirection : leftDirection);
    return [anchor[0] + (d[0] - anchor[0]) * m,
            anchor[1] + (d[1] - anchor[1]) * m];
  }
}
// ----------------------------------------------
// returns an array for properties of a pathpoint
// that corresponds to the parameter "t1"
// q=4 points, t0-2=parameters, anc=coordinate of anchor
function getDivPnt(q, t0, t1, t2, anc){
  if(!anc) anc = bezier(q, t1);
  var r = defDir(q,1, t1, anc, (t2 - t1) / (1 - t1));
  var l = defDir(q,0, t1, anc, (t1 - t0) / t1);
  return [ anc, r, l, PointType.SMOOTH ];
}
// ----------------------------------------------
// returns the [x, y] coordinate of the handle of the point on the bezier curve
// that corresponds to the parameter "t"
// q=4 points, t=paramter, anc=coordinate of anchor, m=magnification ratio
function defDir(q, n, t, anc, m){ // n=0:ldir, n=1:rdir
  var dir = [ t * (t * (q[n][0] - 2 * q[n+1][0] + q[n+2][0]) + 2 * (q[n+1][0] - q[n][0])) + q[n][0],
              t * (t * (q[n][1] - 2 * q[n+1][1] + q[n+2][1]) + 2 * (q[n+1][1] - q[n][1])) + q[n][1]];
  return [anc[0] + (dir[0] - anc[0]) * m,
          anc[1] + (dir[1] - anc[1]) * m];
}
// ----------------------------------------------
// return the [x, y] coordinate on the bezier curve
// that corresponds to the paramter "t"
function bezier(q, t) {
  var u = 1 - t;
  return [u*u*u * q[0][0] + 3*u*t*(u* q[1][0] + t* q[2][0]) + t*t*t * q[3][0],
          u*u*u * q[0][1] + 3*u*t*(u* q[1][1] + t* q[2][1]) + t*t*t * q[3][1]];
}
// ----------------------------------------------
function applyData2Path(p, pnts){ // pathpoint, list
// (format:[[ anchor, rightDirection, leftDirection, poinType ],...]
  if(pnts.length<1) return;

  var pt;

  while(p.length > pnts.length){
    p[ p.length - 1 ].remove();
  }
  
  for(var i in pnts){
    pt = i < p.length ? p[i] : p.add();
    with(pt){
      anchor         = pnts[i][0];
      rightDirection = pnts[i][1];
      leftDirection  = pnts[i][2];
      pointType      = pnts[i][3];
    }
  }
}
// ----------------------------------------------
function applyData2AfterIdx(p, pnts, idx){ // pathpoint, list, index
  if(idx == null || idx < 0){
    applyData2Path(p, pnts);
    return;
  }
  var pt;
  while(p.length-1 > idx){
    p[p.length-1].remove();
  }
  for(var i = 0; i < pnts.length; i++){
    pt = p.add();
    
    with(pt){
      anchor         = pnts[i][0];
      rightDirection = pnts[i][1];
      leftDirection  = pnts[i][2];
      pointType      = pnts[i][3];
    }
  }
}

// ------------------------------------------------
// returns true, if only one anchor points in the row is selected
function oneSelection(psL, ps, psR) {
	return (ps.selected == PathPointSelection.ANCHORPOINT
      && psL.selected != PathPointSelection.ANCHORPOINT
      && psR.selected != PathPointSelection.ANCHORPOINT);
}

// ------------------------------------------------
// returns true, if a segment between pathpoints ps1 and ps2 is selected
function sideSelection(ps1, ps2) {
	return (ps1.selected == PathPointSelection.ANCHORPOINT
      && ps2.selected == PathPointSelection.ANCHORPOINT);
}
// ------------------------------------------------
// if the contents of both arrays are equal, return true (lengthes must be same)
function arrEq(arr1, arr2) {
  for(var i in arr1){
    if (arr1[i] != arr2[i]){
      return false;
    }
  }
  return true;
}

// ------------------------------------------------
// return the bezier curve parameter "t"
// at the point which the length of the bezier curve segment
// (from the point start drawing) is "len"
// when "len" is 0, return the length of whole this segment.
function getT4Len(q, len){
  var m = [q[3][0] - q[0][0] + 3 * (q[1][0] - q[2][0]),
           q[0][0] - 2 * q[1][0] + q[2][0],
           q[1][0] - q[0][0]];
  var n = [q[3][1] - q[0][1] + 3 * (q[1][1] - q[2][1]),
           q[0][1] - 2 * q[1][1] + q[2][1],
           q[1][1] - q[0][1]];
  var k = [ m[0] * m[0] + n[0] * n[0],
            4 * (m[0] * m[1] + n[0] * n[1]),
            2 * ((m[0] * m[2] + n[0] * n[2]) + 2 * (m[1] * m[1] + n[1] * n[1])),
            4 * (m[1] * m[2] + n[1] * n[2]),
            m[2] * m[2] + n[2] * n[2]];
  
   var fullLen = getLength(k, 1);

  if(len == 0){
    return fullLen;
    
  } else if(len < 0){
    len += fullLen;
    if(len < 0) return 0;
    
  } else if(len > fullLen){
    return 1;
  }
  
  var t, d;
  var t0 = 0;
  var t1 = 1;
  var torelance = 0.001;
  
  for(var h = 1; h < 30; h++){
    t = t0 + (t1 - t0) / 2;
    d = len - getLength(k, t);
    
    if(Math.abs(d) < torelance) break;
    else if(d < 0) t1 = t;
    else t0 = t;
  }
  
  return t;
}

// ------------------------------------------------
// return the length of bezier curve segment
// in range of parameter from 0 to "t"
// "m" and "n" are coefficients.
function getLength(k, t){
  var h = t / 128;
  var hh = h * 2;
  
  var fc = function(t, k){
    return Math.sqrt(t * (t * (t * (t * k[0] + k[1]) + k[2]) + k[3]) + k[4]) || 0 };
  
  var total = (fc(0, k) - fc(t, k)) / 2;
  
  for(var i = h; i < t; i += hh){
    total += 2 * fc(i, k) + fc(i + h, k);
  }
  
  return total * hh;
}

// ------------------------------------------------
// extract PathItems from the selection which length of PathPoints
// is greater than "n"
function getPathItemsInSelection(n, pathes){
  if(documents.length < 1) return;
  
  var s = activeDocument.selection;
  
  if (!(s instanceof Array) || s.length < 1) return;

  extractPathes(s, n, pathes);
}

// --------------------------------------
// extract PathItems from "s" (Array of PageItems -- ex. selection),
// and put them into an Array "pathes".  If "pp_length_limit" is specified,
// this function extracts PathItems which PathPoints length is greater
// than this number.
function extractPathes(s, pp_length_limit, pathes){
  for(var i = 0; i < s.length; i++){
    if(s[i].typename == "PathItem"){
      if(pp_length_limit
         && s[i].pathPoints.length <= pp_length_limit){
        continue;
      }
      pathes.push(s[i]);
      
    } else if(s[i].typename == "GroupItem"){
      // search for PathItems in GroupItem, recursively
      extractPathes(s[i].pageItems, pp_length_limit, pathes);
      
    } else if(s[i].typename == "CompoundPathItem"){
      // searches for pathitems in CompoundPathItem, recursively
      // ( ### Grouped PathItems in CompoundPathItem are ignored ### )
      extractPathes(s[i].pathItems, pp_length_limit , pathes);
    }
  }
}

// ----------------------------------------------
// return pathpoint's index. when the argument is out of bounds,
// fixes it if the path is closed (ex. next of last index is 0),
// or return -1 if the path is not closed.
function parseIdx(p, n){ // PathPoints, number for index
  var len = p.length;
  if(p.parent.closed){
    return n >= 0 ? n % len : len - Math.abs(n % len);
  } else {
    return (n < 0 || n > len-1) ? -1 : n;
  }
}

// ------------------------------------------------
// returns true, if a segment between pathpoints ps1 and ps2 is selected
function distance(ps1, ps2) {
	return Math.sqrt((ps1[0] - ps2[0])*(ps1[0] - ps2[0]) +  (ps1[1] -ps2[1])*(ps1[1] -ps2[1]));
}
