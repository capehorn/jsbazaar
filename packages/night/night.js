
import anime from "https://cdn.jsdelivr.net/npm/animejs@3.2.1/lib/anime.es.js";


const main = document.querySelector("#main");

const b1 = addBox(main, {dimension: {w: "10vmin", h: "50vmin", d: "30vmin"}, initTrf: `translate3d(0px, 0px, 0px)`});
const b2 = addBox(main, {dimension: {w: "10vmin", h: "50vmin", d: "30vmin"}, initTrf: `rotateY(90deg)`});
const b3 = addBox(main, {dimension: {w: "10vmin", h: "50vmin", d: "30vmin"}, initTrf: `rotateX(90deg)`});

function addBox(main, {dimension: {w, h, d}, initTrf}) {
    const box = document.createElement("section");
    box.classList.add("box");
    box.style.position = "absolute";
    const front = getNewFace(w, h, `translate3d(calc(-1/2 * ${w}), calc(-1/2 * ${h}), calc(1/2 * ${d}))`);
    const left = getNewFace(d, h, `translate3d(calc(-1/2 * (${w} + ${d})), calc(-1/2 * ${h}), 0) rotateY(-90deg)`);
    const right = getNewFace(d, h, `translate3d(calc(1/2 * (${w} - ${d})), calc(-1/2 * ${h}), 0) rotateY(90deg)`);
    const back = getNewFace(w, h, `translate3d(calc(-1/2 * ${w}), calc(-1/2 * ${h}), calc(-1/2 * ${d})) rotateY(180deg)`);
    const top = getNewFace(w, d, `translate3d(calc(-1/2 * ${w}), calc(-1/2 * (${h} + ${d})), 0) rotateX(90deg)`);
    const bottom = getNewFace(w, d, `translate3d(calc(-1/2 * ${w}), calc(1/2 * (${h} - ${d})), 0) rotateX(-90deg)`);
    const names = ["front", "left", "right", "back", "top", "bottom"];
    [front, left, right, back, top, bottom].forEach((item, idx) => {
        item.appendChild(document.createTextNode(names[idx]));
        box.appendChild(item);
    });
    box.style.transform = getTransformToCenter() + initTrf;
    main.appendChild(box);
    return box;
}

function getTransformToCenter() {
    const cs = window.getComputedStyle(main);
    return ` translate3d(calc(1/2 * ${cs.width}), calc(1/2 * ${cs.height}), 0) `;
}

b1.animate([
      { transform: "rotateY(0deg)" }, 
      { transform: 'rotateY(360deg)' }
    ], { 
      duration: 10000,
      iterations: Infinity,
      composite: 'add'
    });

b2.animate([
    { transform: "rotateY(0deg)" }, 
    { transform: 'rotateY(360deg)' }
    ], { 
    duration: 10000,
    iterations: Infinity,
    composite: 'add'
    });

b3.animate([
    { transform: "rotateZ(0deg)" }, 
    { transform: 'rotateZ(-360deg)' }
    ], { 
    duration: 10000,
    iterations: Infinity,
    composite: 'add'
    });


function getNewFace(width, height, transform = "translate(0, 0)", transformOrigin = "center center") {
    const face = document.createElement("div");
    face.classList.add("face");
    face.style.width = width;
    face.style.height = height;
    face.style.transformOrigin = transformOrigin;
    face.style.transform = transform;
    return face;
}

