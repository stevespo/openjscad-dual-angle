// title      : dual-angle.jscad
// version    : v1.01
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
var marker_h = ball_d/2;
var pin_d = 0.375;
var cg_d = 0.25;
var mb_d = 0.25;
var pap_d = 0.25;
var bh_d = 0.75;
var pin_l = 3.375;
var ball_resolution = 50;

// the terrible 2d circle() function cannot be colored or rotated!
// hack! using 3d sphere and slicing it up

function circle3d(r) {
    return difference(
        sphere({r: r, center: true, fn: ball_resolution}), 
        translate([0,0,r*1.005], cube({size: r*2, center: true})),
        translate([0,0,-r*1.005], cube({size: r*2, center: true})));
}

function angle(length=1) {
    return (length*360)/(Math.PI*ball_d)
}

function distance(angle=0) {
    return (angle/360)*(Math.PI*ball_d)
}

function ball(cgl=[pin_l,0]) {
    return scale(1, 
        union(sphere({r: ball_d/2, center: true, fn: ball_resolution}), 
            pin(), cg(cgl), mb()));
}

function pin() {
    return color("red", cylinder({h:marker_h, d:pin_d}));
}

function cg(cgl=[pin_l,0]) {
    return color("green", 
        rotate([angle(cgl[0]), 0, 0], 
            rotate([0, angle(cgl[1]), 0],
                rotate([0, 0, 45],
                    translate([0, 0, marker_h/2],
                        cube({ size: [cg_d, cg_d, marker_h], center: true}))))));
}

function mb() {
    return color("white", 
        rotate([90.0, 0, 0], 
            cylinder({h:marker_h, d:mb_d})));
}

function balance_hole(position, da=[45,5,30], pap=[5,1]) {
    var aa = distance(da[0]);
    var bb = distance(90) - pap[0];
    var cc = Math.sqrt(Math.pow(aa,2) + Math.pow(bb,2));

    var c = position;
    var a = c/cc*aa;
    var b = c/cc*bb;

    return color("black",
        rotate([angle(distance(90)-b), 0, angle(a)],
            translate([0,0,1],
                cylinder({h:marker_h-1, d:bh_d}))));
}

function layout(da=[45,5,30], pap=[5,1]) {
    return union(
        pin_to_mb(),
        da_line(da[0]),
        val_line(da),
        grip_lines(da, pap));
}

// to keep lines thin, apply after scaling ball
function pin_to_mb() {
    return color("gray", rotate([0,90,0], circle3d(ball_d/2)));
}

function da_line(a=45) {
    return color("black", 
        rotate([0,90,0], 
        rotate([-a,0,0], circle3d(ball_d/2))));
}

function val_line(da=[45,5,30]) {
    return color("black", 
        rotate([0, 90, 0],
        rotate([-da[0]+90, 0, 0],
        rotate([0, angle(da[1]), 0],
        rotate([90+da[2], 0, 0],
        circle3d(ball_d/2))))));  
}

function grip_lines(da=[45,5,30], pap=[5,1]) {
    return color("blue",
        // pap
        rotate([angle(da[1]),0,da[0]],
            cylinder({h:marker_h, d:pap_d})),
        
        // midline, then centerline
        rotate([0,90,0],
        rotate([-da[0]+90,0,0],
        rotate([0, angle(da[1]), 0],
        rotate([da[2], 0, 0],
        rotate([0,angle(pap[1]),0],
        
            // midline
            circle3d(ball_d/2),
            rotate([90,0,0],
            
            // centerline
            rotate([0,angle(pap[0]),0],
            circle3d(ball_d/2)))))))));
}

function hole(od=31/32, id=0.75) {
    var h = [];
    if (od > id) {
        h.push(scale(1,
            color("aqua",
                cylinder({h:marker_h, d:od}))));
    }
    h.push(scale(1.005,
            color("black",
                cylinder({h:marker_h, d:id}))));
    return h;
}

function shole(id=0.75) {
    return scale(1, cylinder({h:marker_h, d:id}));
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
    
    return rotate([angle(da[1]),0,da[0]],
        rotate([angle(pap[1]),0,-da[2]],
            rotate([0,-angle(pap[0]),0],   
                rotate([-angle(mf_o+(f_id/2)), 0, angle(1.0)],
                    hole((span.insert ? f_od : f_id), id=f_id)),
                rotate([-angle(rf_o+(f_id/2)), 0, -angle(1.0)],
                    hole((span.insert ? f_od : f_id), id=f_id)),
                rotate([-angle(thm_o-(t_id/2)),0,0],
                    hole((span.slug ? t_od : t_id), id=t_id))
            )
        )
    );
}

// Define and capture the user input

function getParameterDefinitions() {
  return [
    { name: 'da', type: 'float', initial: 45, caption: "Drill Angle:" },
    { name: 'p2p', type: 'float', initial: 5, caption: "Pin to PAP:" },
    { name: 'val', type: 'float', initial: 30, caption: "VAL:" },
    { name: 'paph', type: 'float', initial: 5.5, caption: "PAP horizontal" },
    { name: 'papv', type: 'float', initial: 0.5, caption: "PAP vertical" },
    { name: 'mf', type: 'float', initial: 4.75, caption: "Span, middle finger" },
    { name: 'rf', type: 'float', initial: 5, caption: "Span, ring finger" },
    { name: 'cgl', type: 'float', initial: 3.5, caption: "CG distance:" },
    { name: 'cgo', type: 'float', initial: 0.0, caption: "CG offset:" },
    { name: 'hand', type: 'choice', caption: 'Throws with?', values: [0,1], captions: ["Right Hand", "Left Hand"], initial: 0 }  ];
}

function main(p) {
    
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
    return translate([0,0,ball_d/2], 
        union(
            ball(cgl), 
            layout(da, pap),
            holes(span, da, pap)
        )
    );
    
}
