const IDM = new DOMMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

export const EDIT_ACTION = {
    EMPTY: Symbol("editAction"),
    SELECT: Symbol("editAction")
}

const EMPTY_VA = Symbol("viewAction");
const ZOOM = Symbol("viewAction");
const PAN = Symbol("viewAction");



export default function Editor(elem) {
    const mouseTracker = MouseTracker();
    let editAction = EDIT_ACTION.EMPTY;
    let viewAction = EMPTY_VA;
    const world = elem.querySelector("#world");
    const canvas = document.createElement("canvas");
    
    canvas.addEventListener("mousedown", mouseTracker.onEvent);
    canvas.addEventListener("mousemove", mouseTracker.onEvent);
    canvas.addEventListener("mouseup", mouseTracker.onEvent);
    canvas.addEventListener("mouseleave", mouseTracker.onEvent);
    canvas.addEventListener("click", mouseTracker.onEvent);
    canvas.classList.add("overlay");
    elem.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    function activateOverlay() {
        canvas.style.pointerEvents = "auto";
    }
    
    function deactivateOverlay() {
        canvas.style.pointerEvents = "none";
    }

    return {
        addTracker: mouseTracker.add,
        removeTracker: mouseTracker.remove,
        editAction: action => {
            if (action) {
                editAction = action;
                switch (action) {
                    case EDIT_ACTION.SELECT: deactivateOverlay(); break;
                    case EDIT_ACTION.EMPTY: activateOverlay(); break;
                    default: break;
                }
            }
            return editAction;
        },
        viewAction: action => {
            if (action) {
                viewAction = action;
            }
            return viewAction;
        },
        inViewAction: actions => actions.includes(viewAction),
        inEditAction: actions => actions.includes(editAction),
        inAction: () => (editAction != EDIT_ACTION.EMPTY) || (viewAction != EMPTY_VA),
        activateOverlay,
        deactivateOverlay,
        getCtx: () => {
            if (ctx) {
                return ctx;
            } else {
                throw new Error("Context is not created yet. Be sure overlay is activated before calling this method!");
            }
        },
        clearCtx: () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
        },
        getElem: () => elem,
        getWorldMatrix: () => getMatrix(world),
        setWorldMatrix: matrix => world.style.transform = matrix,
    }
}

export function panTracker(editor) {
    let isActive = false;
    let matrix = null;
    let startPos = {x: -1, y: -1};
    let startOffsetPos = {x: -1, y: -1};
    let startScreenPos = {x: -1, y: -1};
    return {
        isActive,
        start: e => editor.inViewAction([EMPTY_VA, PAN]) && "mousedown" === e.type,
        onStart: e => {
            editor.viewAction(PAN);
            startOffsetPos = {x: e.offsetX, y: e.offsetY};
            startScreenPos = {x: e.screenX, y: e.screenY};
            matrix = editor.getWorldMatrix();
        },
        stop: e => "mouseup" === e.type || "mouseleave" === e.type,
        onStop: e => {
            if (matrix != null) {
                editor.setWorldMatrix(matrix.translate(e.screenX - startScreenPos.x, e.screenY - startScreenPos.y, 0));
            }
            startPos = {x: -1, y: -1};
            startScreenPos = {x: -1, y: -1};
            matrix = null;
        },
        mousemove: e => {
            if (matrix != null) {
                editor.setWorldMatrix(matrix.translate(e.screenX - startScreenPos.x, e.screenY - startScreenPos.y, 0));
            }
        }
    }
}

export function selectTracker(editor, selector) {
    let isActive = false;
    if (selector) {
        [...editor.getElem().querySelectorAll(selector)].forEach(s => s.addEventListener("click", e => {
            console.log("target:" + e.target);
            console.log("current target:" + e.currentTarget);
        }));
    }

    return {
        isActive,
        start: e => editor.inEditAction([EDIT_ACTION.SELECT]) && "click" === e.type,
        onStart: e => {

            //editor.click(e);
            console.log("Clicked");
        },
        stop: e => true,
        onStop: e => {
        },
    }
}

function MouseTracker(...trackers) {
    let TS = [];
    TS.push(...trackers);

    function dispatch (e) {
        for(let i = 0; i <= TS.length - 1; i++) {
            const tracker = TS[i];
            if (tracker.start(e)) {
                tracker.isActive = true;
                if (tracker.onStart) {
                    tracker.onStart(e);
                }
            }

            if (tracker.isActive && tracker.stop(e)) {
                tracker.isActive = false;
                if (tracker.onStop) {
                    tracker.onStop(e);
                }
            }

            if (tracker.isActive && tracker[e.type]) {
                tracker[e.type](e);
            }
        }
    }

    return {

        add(tracker) {
            if (!TS.includes(tracker)) {
                TS.push(tracker);
            }
        },

        remove(tracker) {
            TS = TS.filter(item => item !== tracker);
        },

        onEvent(e) {
            //console.log(e.type);
            dispatch(e);
        },

        onEventThrottled(throttle = 100) {
            let lastTime = 0;
            return function(e) {
                let now = Date.now();
                if (now - lastTime >= throttle) {
                    dispatch(e);
                    lastTime = now;
                }
            }
        }
    };
}

function extractNum(value) {
    return parseFloat(value.slice(0, -2));
}

function getMatrix(elem) {
    const transform = window.getComputedStyle(elem).transform;
    if (transform === "none") {
        return DOMMatrix.fromMatrix(IDM);
    } else {
        const matrixValues = transform.split('(')[1].split(')')[0].split(', ');
        return initFromArray(matrixValues);
    }
}


function initFromArray(vs) {
    if (6 === vs.length) {
        return new DOMMatrix([
            vs[0], vs[1], 0, 0, 
            vs[2], vs[3], 0, 0, 
            0, 0, 1, 0, 
            vs[4], vs[5], 0, 1]);
    } else {
        return new DOMMatrix(vs);
    }
}


// const computedStyle = window.getComputedStyle(elem);
            // canvas.width = Math.floor(stripUnit(computedStyle.width));
            // canvas.height = Math.floor(stripUnit(computedStyle.height));
