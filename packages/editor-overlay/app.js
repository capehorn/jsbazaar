import Editor from "./editor-overlay.js";
import { panTracker, selectTracker, moveTracker, EDIT_ACTION } from "./editor-overlay.js";

const SVGNS = "http://www.w3.org/2000/svg";
const POINT_RADIUS = 3;

function createLineTracker(editor/*, svg*/) {

    let isActive = false;
    let isAxial = false;
    let line = {x0: -1, y0: -1, x1: -1, y1: -1};

    function drawLineStart(ctx) {
        ctx.beginPath();
        ctx.arc(line.x0, line.y0, POINT_RADIUS, 0, 2 * Math.PI);
        ctx.stroke();
    }

    function drawLine(ctx) {
        if (isAxial) {
            if (Math.abs(line.x0 - line.x1) < Math.abs(line.y0 - line.y1)) { // vertical
                line.x1 = line.x0;
            } else { // horizontal
                line.y1 = line.y0;
            }
        }
        ctx.beginPath();
        ctx.moveTo(line.x0, line.y0);
        ctx.lineTo(line.x1, line.y1);
        ctx.stroke();
    }

    function drawLineEnd(ctx) {
        ctx.beginPath();
        ctx.arc(line.x1, line.y1, POINT_RADIUS, 0, 2 * Math.PI);
        ctx.stroke();
    }

    return {
        isActive,
        start: e => (! editor.inAction()) && "mousedown" === e.type,
        onStart(e) {
            line.x0 = e.offsetX;
            line.y0 = e.offsetY;
            isAxial = e.ctrlKey;
            editor.activateOverlay();
            drawLineStart(editor.getCtx());
        },
        stop: e => "mouseup" === e.type,
        onStop: e => {
            editor.clearCtx();
            editor.deactivateOverlay();
            //addLine(svg, line);
            line = {x0: -1, y0: -1, x1: -1, y1: -1};
        },
        mousemove: e => {
            line.x1 = e.offsetX;
            line.y1 = e.offsetY;
            isAxial = e.ctrlKey;
            editor.clearCtx();
            const ctx = editor.getCtx();
            drawLine(ctx);
            drawLineStart(ctx);
            drawLineEnd(ctx);
        }
    }   
}

function createAndAddSvg(elem, id, viewBox) {
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("id", id);
    svg.setAttribute("viewBox", viewBox);
    svg.setAttributeNS(SVGNS, "preserveAspectRatio", "xMidYMid meet");
    elem.appendChild(svg);
    return svg;
}

function stripUnit(value) {
    return parseFloat(value.slice(0, -2));
}

const editorNode = document.getElementById("editor");
const cs = window.getComputedStyle(editorNode);
const w = Math.floor(stripUnit(cs.width));
const h = Math.floor(stripUnit(cs.height));
//const svg = createAndAddSvg(editorNode, "svg", `0 0 ${w} ${h}`);
const editor = Editor(editorNode);
//editor.activateOverlay();
//const createLineT = createLineTracker(editor/*, svg*/);
//editor.addTracker(createLineT);
editor.addTracker(panTracker(editor));
editor.addTracker(selectTracker(editor));
editor.addTracker(moveTracker(editor));

document.querySelector("#btnSelect").addEventListener("click", e => {
    const classList = e.target.classList;
    if (classList.contains("off")) {
        classList.remove("off")
        classList.add("on");
        editor.editAction(EDIT_ACTION.SELECT);
    } else {
        classList.add("off");
        classList.remove("on");
        editor.editAction(EDIT_ACTION.EMPTY);
    }
});