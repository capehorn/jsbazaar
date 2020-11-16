const LINE_DELTA = 0.0001;
const TID = ` translate(${0})`;

function P(x, y, z, w) {return new DOMPoint(x, y, z, w);}
function px(v) {return `${v}px`;}
function trfs(...trfs) {return trfs.join(" ");}
function tX(x) {return ` translateX(${x})`;}
function tY(y) {return ` translateY(${px(y)})`;}
function tZ(z) {return ` translateZ(${px(z)})`;}
function tXY(x, y) {return ` translate(${px(x)}, ${px(y)})`;}
function t3d(x, y, z) {return ` translate3d(${px(x)}, ${px(y)}, ${px(z)})`;}
function rX(deg) {return ` rotateX(${deg}deg)`;}
function rY(deg) {return ` rotateY(${deg}deg)`;}
function rZ(deg) {return ` rotateZ(${deg}deg)`;}

const origo = document.querySelector("#origo");

// const tetrahedron100 = newTetrahedron({edgeLength: 100});
// const tetrahedron200 = newTetrahedron({edgeLength: 200});
// origo.appendChild(tetrahedron100);
// tetrahedron100.style.transform = t3d(-86, -86, 400);

// const cuboid = newCuboid({x: 100, y: 200});
// origo.appendChild(cuboid);


const basePoints = nSide({n: 9, length: 100});
const prism = newPrism({basePoints});
origo.appendChild(prism);

// const cmd = [tetrahedron100, "putTo", P(0, 0)];
// $.execute(cmd);

const is = {
    domElement: v => v !== undefined && Node.ELEMENT_NODE === v.nodeType,
    array: v => v !== undefined && Array.isArray(v),
};

const $ = (function() {

    const executor = {
        putTo(what, where) {
            if (is.domElement(what)) {

            }
        }
    };


    return {
      execute(cmd) {
          //console.log(cmd);
          executor[cmd[1]](cmd[0], cmd[2]);
      }
    };
})();

function newPrism({basePoints, height}) {
    const base = toFace(basePoints, true);
    const ref = newRef("prism", {});
    addFaces(ref, base);
    return ref;
}


function newCuboid({x = 100, y = 100, z = 100}) {
    const back = toFace([P(0, 0), P(x, 0), P(x, y), P(0, y)], false);
    back.el.style.transform = rY(180);

    const front = toFace([P(0, 0), P(x, 0), P(x, y), P(0, y)], false);
    front.el.style.transform = tZ(z);

    const left = toFace([P(0, 0), P(z, 0), P(z, y), P(0, y)], false);
    left.el.style.transform = trfs(rY(-90), t3d(z/2, 0, z/2));

    const right = toFace([P(0, 0), P(z, 0), P(z, y), P(0, y)], false);
    right.el.style.transform = trfs(rY(90), t3d(-x+(z/2), 0, z/2));

    const top = toFace([P(0, 0), P(x, 0), P(x, z), P(0, z)], false);
    top.el.style.transform = trfs(rX(90), t3d(0, z/2, z/2));

    const bottom = toFace([P(0, 0), P(x, 0), P(x, z), P(0, z)], false);
    bottom.el.style.transform = trfs(rX(90), t3d(0, z/2, z/2));

    // const top = toFace([P(0, 0), P(x, 0), P(x, y), P(0, y)]);
    // top.el.style.transform = trfs(t3d(-1/2*x, 1/2*(y + z), 0), rX(-90));

    // const back = toFace([P(0, 0), P(x, 0), P(x, y), P(0, y)]);
    // back.el.style.transform = trfs(t3d(-1/2*x, 1/2*(y + z), 0), rX(-90));
    // const face1 = toFace(t1);
    // const face2 = toFace(t1);
    // const face3 = toFace(t1);
    //rect1.el.style.transformOrigin = "top center";
    //rect1.el.style.transform = rX(angleAtTop);

    // face2.el.style.transformOrigin = "top center";
    // face2.el.style.transform = trfs(rY(120), rX(angleAtTop));

    // face3.el.style.transformOrigin = "top center";
    // face3.el.style.transform = trfs(rY(240), rX(angleAtTop));
    const ref = newRef("cuboid", {transformOrigin: `${-x/2}px ${-y/2}px ${-z/2}px`});
    addFaces(ref, back, front, left, right, top);
    return ref;
}

function newTetrahedron({edgeLength = 100}) {
    const t1 = triangle({a: edgeLength});
    const face1 = toFace(t1);
    const face2 = toFace(t1);
    const face3 = toFace(t1);
    const angleAtTop = 90 - 70.53;
    face1.el.style.transformOrigin = "top center";
    face1.el.style.transform = rX(angleAtTop);

    face2.el.style.transformOrigin = "top center";
    face2.el.style.transform = trfs(rY(120), rX(angleAtTop));

    face3.el.style.transformOrigin = "top center";
    face3.el.style.transform = trfs(rY(240), rX(angleAtTop));
    const ref = newRef("tetrahedron", {transformOrigin: "86px 100px"});
    addFaces(ref, face1, face2, face3);
    return ref;
}

function triangle({a, b = null, c = null}) {
    const m = new DOMMatrix().setMatrixValue(tY(-1*a));
    const p1 = new DOMPoint().matrixTransform(m);
    const p2 = p1.matrixTransform(m.setMatrixValue(rZ(120)));
    const p3 = p2.matrixTransform(m);
    return [p1, p2, p3];
}

function nSide({n, length}) {
    const p = new DOMPoint(0, -length);
    const m = new DOMMatrix();
    const angle = 360/n;
    return [...Array(n).keys()].map(i => p.matrixTransform(m.rotateAxisAngle(0, 0, 1, i * angle)));
}

function toFace(ps, useClipPath = true) {
    const {points, min, max} = normalize(ps);
    const clipPath = useClipPath ? buildClipPath(points) : null;
    const el = toElem(max.x - min.x, max.y - min.y, clipPath);
    const edges = points.map( (p, idx, arr) => newEdge(p, idx === arr.length - 1 ? arr[0] : arr[idx+1]) );
    edges.forEach(e => el.appendChild(e));
    return {el, min, max};
}

function normalize(points) {
    let minX = points[0].x;
    let minY = points[0].y;
    let maxX = minX;
    let maxY = minY;
    points.forEach(({x, y}) => {
        if(x < minX) {
            minX = x;
        }
        if(maxX <  x) {
            maxX = x;
        }
        if(y < minY) {
            minY = y;
        }
        if(maxY <  y) {
            maxY = y;
        }
    });
    const dx = minX < 0 ? -minX : minX;
    const dy = minY < 0 ? -minY : minY;
    return {
        points: points.map(p => {
            p.x = p.x + dx;
            p.y = p.y + dy;
            return p;
        }),
        min: new DOMPoint(minX, minY),
        max: new DOMPoint(maxX, maxY),
    };
}

function toElem(w, h, clipPath = null) {
    const el = document.createElement("div");
    el.classList.add("face");
    const s = el.style;
    s.width = px(w);
    s.height = px(h);
    if (clipPath != null) {
        s.clipPath = clipPath;
    }
    return el;
}

function buildClipPath(points) {
    return "polygon(" + points.map(({x, y}) => {
        return `${px(x)} ${px(y)}`;
    }).join(", ") + ")";
}

function cloneFace(face) {
    return {el: face.el.cloneNode(true), min: new DOMPoint(face.min), max: new DOMPoint(face.max)};
}

function newEdge(p1, p2) {
    const el = document.createElement("div");
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const deg = calcRotation(dx, dy);
    console.log(deg);
    el.classList.add("edge");
    el.style.width = `${Math.sqrt(dx*dx + dy*dy)}px`;
    el.style.transform = trfs(tXY(p1.x, p1.y), rZ(deg));
    return el;
}

function calcRotation(dx, dy) {
    if (Math.abs(dy) < LINE_DELTA) { //horizontal edge
        if (0 < dx) {
            return 0;
        } else {
            return 180;
        }
    } else if (Math.abs(dx) < LINE_DELTA) { //vertical edge
        if (0 < dy){
            return 90; // volume|
        } else {
            return 270; // |volume
        }
    } else {
        const angle = Math.atan2(Math.abs(dy), Math.abs(dx)) * 180 / Math.PI;
        if(0 < dy && dx < 0) { // volume/
            return 180 - angle;
        } else if (dy < 0 && dx < 0) {  // \volume
            return 180 + angle;
        } else if (dy < 0 && 0 < dx) {
            return -angle; // /volume
        }
        return angle;
    }
    // else if (dy > 0) { //positive /  valume on the right
    //     return -Math.atan2(Math.abs(dy), Math.abs(dx)) * 180 / Math.PI;
    // } else if (dy < 0 && dx > 0) { //  volume/
    //     return -Math.atan2(Math.abs(dy), Math.abs(dx)) * 180 / Math.PI;
    // } else { //negative \ valume on the right
    //     return Math.atan2(Math.abs(dy), Math.abs(dx)) * 180 / Math.PI;
    // }
} 


function newRef(shapeType, {transformOrigin = "center center"}) {
    const el = document.createElement("div");
    el.dataset.shapeType = shapeType;
    el.classList.add("ref");
    el.style.transformOrigin = transformOrigin;
    return el;
}

function addFaces(ref, ...faces) {
    faces.forEach(f => ref.appendChild(f.el));
}

// tetrahedron100.animate([
//     // keyframes
//     { transform: "rotateZ(0deg)" }, 
//     { transform: 'rotateZ(360deg)' }
//   ], { 
//     // timing options
//     duration: 10000,
//     iterations: Infinity,
//       composite: 'add'
//   });

// origo.animate([
//     // keyframes
//     { transform: "rotateY(0deg)" }, 
//     { transform: 'rotateY(360deg)' }
//   ], { 
//     // timing options
//     duration: 10000,
//     iterations: Infinity,
//       composite: 'add'
//   });
