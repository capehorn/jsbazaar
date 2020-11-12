const LINE_DELTA = 0.0001;

function px(v) {return `${v}px`;}
function trfs(...trfs) {return trfs.join(" ");}
function tX(x) {return ` translateX(${x})`;}
function tY(y) {return ` translateY(${px(y)})`;}
function tXY(x, y) {return ` translate(${px(x)}, ${px(y)})`;}
function t3d(x, y, z) {return ` translate3d(${px(x)}, ${px(y)}, ${px(z)})`;}
function rX(deg) {return ` rotateX(${deg}deg)`;}
function rY(deg) {return ` rotateY(${deg}deg)`;}
function rZ(deg) {return ` rotateZ(${deg}deg)`;}

const tetrahedron = {
    faces: [
        [
            0, -100, 0,
            100, 0, 0,
            100, 100, 0,
        ]
    ]
}

const origo = document.querySelector("#origo");
const frag = document.createDocumentFragment();
const t1 = triangle();
//const t2 = cloneFace(t1);


const ref = newRef("-100px", "-100px");

const face1 = toFace(t1);
const face2 = toFace(t1);
const face3 = toFace(t1);
face1.el.style.transformOrigin = "top center";
face1.el.style.transform = rX(90 - 70.53);

face2.el.style.transformOrigin = "top center";
face2.el.style.transform = trfs(rY(120), rX(90 - 70.53));

face3.el.style.transformOrigin = "top center";
face3.el.style.transform = trfs(rY(240), rX(90 - 70.53));

addFaces(ref, face1, face2, face3);


origo.appendChild(ref);

function triangle() {
    const m = new DOMMatrix().setMatrixValue(tY(-100));
    const p1 = new DOMPoint().matrixTransform(m);
    const p2 = p1.matrixTransform(m.setMatrixValue(rZ(120)));
    const p3 = p2.matrixTransform(m);
    return [p1, p2, p3];
}

function toFace(ps) {
    const {points, min, max} = normalize(ps);
    const clipPath = buildClipPath(points);
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

function toElem(w, h, clipPath) {
    const el = document.createElement("div");
    el.classList.add("face");
    const s = el.style;
    s.width = px(w);
    s.height = px(h);
    s.clipPath = clipPath;
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
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const deg = calcRotation(dx, dy);
    el.classList.add("edge");
    el.style.width = `${Math.sqrt(dx*dx + dy*dy)}px`;
    el.style.transform = trfs(tXY(p1.x, p1.y), rZ(deg));
    return el;
}

function calcRotation(dx, dy) {
    if (Math.abs(dy) < LINE_DELTA && 0 < dx) { //vertical - value on the top
        return 180;
    } else if (Math.abs(dx) < LINE_DELTA && dy < 0) { //horizontal - valume on the left
        return 90;
    } else if (dy > 0) { //positive /  valume on the right
        return -Math.atan2(Math.abs(dy), Math.abs(dx)) * 180 / Math.PI;
    } else { //negative \ value on the right
        return Math.atan2(Math.abs(dy), Math.abs(dx)) * 180 / Math.PI;
    }
} 


function newRef(top, left) {
    const el = document.createElement("div");
    el.classList.add("ref");
    el.style.top = top;
    el.style.left = left;
    return el;
}

function addFaces(ref, ...faces) {
    faces.forEach(f => ref.appendChild(f.el));
}

ref.animate([
    // keyframes
    { transform: "rotateZ(0deg)" }, 
    { transform: 'rotateZ(360deg) rotateY(-720deg)' }
  ], { 
    // timing options
    duration: 10000,
    iterations: Infinity,
      composite: 'add'
  });
