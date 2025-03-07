// https://github.com/stevespo/openjscad-dual-angle

// title      : dual-angle-v2.jscad
// version    : v2.0
// author     : stevespo

// Overall, everything seems to work fairly well, but very limited testing!
// Very little time invested in this... intentionally simple...

// This started out as a 1 hour OpenSCAD project and then converted to OpenJSCAD
// for the browser support and improved scripting.

// Potential Future work?
//
// - gradient line balance holes
// - Motion Hole
// - initial ball track
// - two finger (thumbless) layouts

// globals

var ball_d = 8.595;
var marker_h = .5;
var pin_d = 0.375;
var cg_d = 0.25;
var mb_d = 0.25;
var pap_d = 0.25;
var bh_d = 0.75;
var pin_l = 3.375;
var ball_resolution = 100;

const jscad = require('@jscad/modeling')
const { cube, cuboid, sphere, cylinder } = jscad.primitives
const { translate, rotate, scale } = jscad.transforms
const { union, subtract } = jscad.booleans
const { colorize, colorNameToRgb } = jscad.colors
const { degToRad, radToDeg } = jscad.utils


// the terrible 2d circle() function cannot be colored or rotated!
// hack! using 3d sphere and slicing it up

function fullCircle3d(r) {
    return subtract(
        sphere({radius: r, segments: ball_resolution}), 
        translate([0,0,r*1.005], cube({size: r*2})),
        translate([0,0,-r*1.005], cube({size: r*2})));
}

function circle3d(r) {
    return fullCircle3d(r);
    // return subtract(
	// fullCircle3d(r),
	// translate([0,r*1.005, 0], cube({size: r*2})));
}

function angle(length=1) {
    return (length*360)/(Math.PI*ball_d)
}

function distance(angle=0) {
    return (angle/360)*(Math.PI*ball_d)
}

function ball(cgl=[pin_l,0]) {
    return [
	colorize(colorNameToRgb("darkslateblue"), 
	    sphere({radius: ball_d/2.002, segments: 64})), 
	pin(), cg(cgl), mb()]
}

function trimTranslateToSurface(o, height) {

}

function pin() {
    return colorize(colorNameToRgb("red"), 
        translate([0, 0, ball_d/2-marker_h/2],
	    cylinder({height: marker_h, radius: pin_d/2})));
}

function cg(cgl=[pin_l,0]) {
    return colorize(colorNameToRgb("green"), 
        rotate([degToRad(angle(cgl[0])), 0, 0], 
            rotate([0, degToRad(angle(cgl[1])), 0],
                rotate([0, 0, degToRad(45)],
                    translate([0, 0, ball_d/2-marker_h/2],
                        cuboid({ size: [cg_d, cg_d, marker_h] }))))));
}

function mb() {
    return colorize(colorNameToRgb("white"), 
        rotate([degToRad(90.0), 0, 0], 
            translate([0, 0, ball_d/2-marker_h/2],
	        cylinder({height: marker_h, radius: mb_d/2}))));
}

function balance_hole(position, da=[45,5,30], pap=[5,1]) {
    var aa = distance(da[0]);
    var bb = distance(90) - pap[0];
    var cc = Math.sqrt(Math.pow(aa,2) + Math.pow(bb,2));

    var c = position;
    var a = c/cc*aa;
    var b = c/cc*bb;

    return colorize(colorNameToRgb("black"),
        rotate([degToRad(angle(distance(90)-b)), 0, degToRad(a)],
            translate([0,0,1],
                cylinder({height: marker_h-1, radius: bh_d/2}))));
}

function layout(da=[45,5,30], pap=[5,1]) {
    return [
        pin_to_mb(),
        da_line(da[0]),
        val_line(da),
        grip_lines(da, pap)];
}

// to keep lines thin, apply after scaling ball
function pin_to_mb() {
    return colorize(colorNameToRgb("white"), 
	rotate([0,degToRad(90),0], circle3d(ball_d/2)));
}

function da_line(a=45) {
    return colorize(colorNameToRgb("white"), 
        rotate([0,degToRad(90),0], 
        rotate([degToRad(-a),0,0], circle3d(ball_d/2))));
}

function val_line(da=[45,5,30]) {
    return colorize(colorNameToRgb("white"), 
        rotate([0, degToRad(90), 0],
        rotate([degToRad(-da[0]+90), 0, 0],
        rotate([0, degToRad(angle(da[1])), 0],
        rotate([degToRad(90+da[2]), 0, 0],
        circle3d(ball_d/2))))));  
}

function grip_lines(da=[45,5,30], pap=[5,1]) {
    return colorize(colorNameToRgb("gray"),
        // pap
        rotate([degToRad(angle(da[1])),0,degToRad(da[0])],
	    translate([0, 0, ball_d/2-marker_h/2],
                cylinder({height: marker_h, radius: pap_d/2}))),
        
        // midline, then centerline
        rotate([0,degToRad(90),0],
        rotate([degToRad(-da[0]+90),0,0],
        rotate([0, degToRad(angle(da[1])), 0],
        rotate([degToRad(da[2]), 0, 0],
        rotate([0,degToRad(angle(pap[1])),0],
        
            // midline
            circle3d(ball_d/2),
            rotate([degToRad(90),0,0],
            
            // centerline
            rotate([0,degToRad(angle(pap[0])),0],
            circle3d(ball_d/2)))))))));
}

function hole(od=31/32, id=0.75) {
    var h = [];
    if (od > id) {
        h.push(scale([1,1,1],
            colorize(colorNameToRgb("aqua"),
		translate([0, 0, ball_d/2-marker_h/2],
                    cylinder({height: marker_h, radius: od/2})))));
    }
    h.push(scale([1.005,1.005,1.005],
            colorize(colorNameToRgb("black"),
		translate([0, 0, ball_d/2-marker_h/2],
                	cylinder({height: marker_h, radius: id/2})))));
    return h;
}

function shole(id=0.75) {
    return translate([0, 0, ball_d/2-marker_h/2], 
	cylinder({height: marker_h, radius: id/2}));
}

function holes(span, da=[45,5,30], pap=[5,1]) {
    
    var avg = ((span.mf+span.rf)/2);
    var avg_mid = avg/2;  
    var mf_o = span.mf-avg_mid;
    var rf_o = span.rf-avg_mid;
    var thm_o = -avg_mid;
    
    var f_id = 0.75;
    var f_od = 31/32;
    var t_id = 31/32;
    var t_od = 1.25;  
    
    return rotate([degToRad(angle(da[1])),0,degToRad(da[0])],
        rotate([degToRad(angle(pap[1])),0,degToRad(-da[2])],
            rotate([0,degToRad(-angle(pap[0])),0],   
                rotate([degToRad(-angle(mf_o+(f_id/2))), 0, degToRad(angle(1.0))],
                    hole((span.insert ? f_od : f_id), id=f_id)),
                rotate([degToRad(-angle(rf_o+(f_id/2))), 0, degToRad(-angle(1.0))],
                    hole((span.insert ? f_od : f_id), id=f_id)),
                rotate([degToRad(-angle(thm_o-(t_id/2))),0,0],
                    hole((span.slug ? t_od : t_id), id=t_id))
            )
        )
    );
}

// Define and capture the user input

const getParameterDefinitions = () => {
  return [
    { name: 'da', type: 'float', initial: 45, caption: "Drill Angle:" },
    { name: 'p2p', type: 'float', initial: 5, caption: "Pin to PAP:" },
    { name: 'val', type: 'float', initial: 30, caption: "VAL:" },
    { name: 'paph', type: 'float', initial: 5.0, caption: "PAP horizontal" },
    { name: 'papv', type: 'float', initial: 0.75, caption: "PAP vertical" },
    { name: 'mf', type: 'float', initial: 4.625, caption: "Span, middle finger" },
    { name: 'rf', type: 'float', initial: 4.875, caption: "Span, ring finger" },
    { name: 'cgl', type: 'float', initial: 3.5, caption: "CG distance:" },
    { name: 'cgo', type: 'float', initial: 0.0, caption: "CG offset:" },
    { name: 'hand', type: 'choice', caption: 'Throws with?', values: [0,1], captions: ["Right Hand", "Left Hand"], initial: 0 }  ];
}

const main = (p) => {
    
    // cg location [distance from pin, offset]
    var cgl = [p.cgl, p.cgo];
    // standard dual angle
    var da = [p.da, p.p2p, p.val];
    // pap location [over, up] or [over, -down]
    var pap = [p.paph, p.papv];
    // span distances and boolean
    var span = { mf: p.mf, rf: p.rf, insert: true, slug: true };
    
    // Left handed layouts are accomplished by tweaking some values
    if (p.hand == 1) {
        da[0] = -p.da;
        da[2] = -p.val;
        pap[0] = -p.paph;
    }
    

    // better default scaling/rotation/positioning here would be nice
    /*
    return translate([0,0,0], 
        union(
            ball(cgl), 
            layout(da, pap),
            holes(span, da, pap)
        )
    );
    */

    return [ball(cgl), layout(da, pap), holes(span, da, pap)]
    
}

module.exports = { main, getParameterDefinitions }
