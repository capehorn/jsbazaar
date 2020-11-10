
const main = document.querySelector("#main");
const foreground = document.querySelector("#foreground");

const W = main.clientWidth;
const H = main.clientHeight;
const VMIN = Math.min(W, H) / 100;
const VMAX = Math.max(W, H) / 100;

const TID = tXY(0, 0);

function px(v) {return `${v}px`;}
function trfs(...trfs) {return trfs.join(" ");}
function tX(x) {return `translateX(${px(x)})`;}
function tY(y) {return `translateY(${px(y)})`;}
function tXY(x, y) {return `translate(${x}, ${y})`;}
function t3d(x, y, z) {return `translate3d(${px(x)}, ${px(y)}, ${px(z)})`;}
function rX(deg) {return `rotateX(${deg}deg)`;}
function rY(deg) {return `rotateY(${deg}deg)`;}
function rZ(deg) {return `rotateZ(${deg}deg)`;}

const moon = addCircle(foreground, {dimension: {r: 120*VMIN}, initTrf: t3d(-180*VMIN, -120*VMIN, -2000), style: {}});

//const b1 = addBox(foreground, {dimension: {w: "60vmin", h: "140vmin", d: "60vmin"}, initTrf: `translate3d(55vmin, 20vmin, 60px)`});
const b2 = addBox(foreground, {dimension: {w: 30*VMIN, h: 130*VMIN, d: 30*VMIN}, initTrf: t3d(-20*VMIN, 40*VMIN, -300)});
const b3 = addBox(foreground, {dimension: {w: 120*VMIN, h: 130*VMIN, d: 40*VMIN}, initTrf: t3d(-90*VMIN, 50*VMIN, -500)});
const b4 = addBox(foreground, {dimension: {w: 70*VMIN, h: 150*VMIN, d: 40*VMIN}, initTrf: trfs(t3d(20*VMIN, 70*VMIN, -800), rY(20))});

// addWindows(b1.querySelector("[data-face='front']"), {windows: [30, 10]});
// addWindows(b1.querySelector("[data-face='left']"), {windows: [30, 10]});

addWindows(b2.querySelector("[data-face='front']"), {windows: [30, 10]});
addWindows(b2.querySelector("[data-face='right']"), {windows: [30, 10]});

addWindows(b3.querySelector("[data-face='front']"), {windows: [30, 16]});
addWindows(b4.querySelector("[data-face='front']"), {windows: [30, 16]});

addTower(foreground, {
    dimension: {
        w: 60*VMIN, h: 10*VMIN, d: 60*VMIN
    }, 
    level: {
        count: 12, rot: 5
    }, 
    initTrf: t3d(55*VMIN, 60*VMIN, 60)
});

function addTower(wrap, {dimension: {w, h, d}, level: {count, rot}, initTrf = TID}) {
    const el = document.createElement("section");
    el.style.position = "absolute";
    for(let level = 1; level <= count; level++) {
        addBox(el, {dimension: {w, h, d}, initTrf: trfs(tY(-level*h), rY(level*rot))});
    }
    el.style.transform = initTrf;
    el.querySelectorAll("[data-face]").forEach(face => {
        face.style.borderRadius = "4px";
        face.style.backgroundColor = "rgb(40,40,40)";
    });
    wrap.appendChild(el);
}

function addBox(wrap, {dimension: {w, h, d}, initTrf = TID}) {
    const el = document.createElement("section");
    el.classList.add("box");
    el.style.position = "absolute";
    const front = getNewFace(w, h, t3d(-1/2*w, -1/2*h, 1/2*d));
    const left = getNewFace(d, h, trfs(t3d(-1/2*(w + d), -1/2*h, 0), rY(-90)));
    const right = getNewFace(d, h, trfs(t3d(1/2*(w - d), -1/2*h, 0), rY(90)));
    const back = getNewFace(w, h, trfs(t3d(-1/2*w, -1/2*h, -1/2*d), rY(180)));
    const top = getNewFace(w, d, trfs(t3d(-1/2*w, -1/2*(h + d), 0), rX(90)));
    const bottom = getNewFace(w, d, trfs(t3d(-1/2*w, 1/2*(h - d), 0), rX(-90)));
    const names = ["front", "left", "right", "back", "top", "bottom"];
    [front, left, right, back, top, bottom].forEach((item, idx) => {
        item.dataset.face = names[idx];
        // item.appendChild(document.createTextNode(names[idx]));
        el.appendChild(item);
    });
    el.style.transform = initTrf;
    wrap.appendChild(el);
    return el;
}

function getNewFace(width, height, transform = TID, transformOrigin = "center center") {
    const face = document.createElement("div");
    face.classList.add("face");
    face.style.width = px(width);
    face.style.height = px(height);
    face.style.transformOrigin = transformOrigin;
    face.style.transform = transform;
    return face;
}

function addCircle(wrap, {dimension: {r}, initTrf = TID, style = {}}) {
    const el = document.createElement("div");
    el.setAttribute("id", "moon");

    applyStyle(el, style);
    el.style.width = px(r/2);
    el.style.height = px(r/2);
    el.style.borderRadius = "50%";
    el.style.transform = initTrf;
    wrap.appendChild(el);
    return el;
}

// function getTransformToCenter() {
//     const cs = window.getComputedStyle(foreground);
//     return ` translate3d(calc(1/2 * ${cs.width}), calc(1/2 * ${cs.height}), 0) `;
// }

function applyStyle(el, styleObj) {
    Object.entries(styleObj).forEach(([k, v]) => el.style[k] = v);
}

function addWindows(face, {windows: [row, col], on = 10}) {
    face.style = face.style.cssText + `
        display: grid;
        grid-template-rows: repeat(${row}, 1fr);
        grid-template-columns: repeat(${col}, 1fr);
        column-gap: 4px;
        row-gap: 2px;
        justify-items: stretch;
    `;

    const lightOn = [];
    for(let i = 0; i < on; i++) {
        lightOn.push([getRandomInt(row) + 1, getRandomInt(col) + 1]);
    }

    for(let r = 1; r <= row; r++) {
        for(let c = 1; c <= col; c++) {
            const el = document.createElement("div");
            const isOn = lightOn.find(item => item[0] === r && item[1] === c);
            el.style = `
                background-color: ${isOn ? "rgba(70, 102, 255, .9)" : "rgb(40,40,40)"};
                ${isOn ? "box-shadow: 0 0 18px rgba(70, 102, 255, .9);" : ""}
                grid-row: ${r};
                grid-column: ${c};
            `;
            face.appendChild(el);
        }
    }
}

function getRandomInt(maxExcluded) {
    return Math.floor(Math.random() * Math.floor(maxExcluded));
}

foreground.animate([
      { transform: "translate3d(0, 0, 0)" }, 
      { transform: 'translate3d(180px, 0px, 1200px)' }
    ], { 
        delay: 2000,
        duration: 5000,
        easing: "ease-in-out",
        composite: 'add'
    });




