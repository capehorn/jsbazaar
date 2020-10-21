const IDM = new DOMMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

export const EDIT_ACTION = {
    EMPTY: Symbol("editAction"),
    SELECT: Symbol("editAction")
}

const EMPTY_VA = Symbol("viewAction");
const ZOOM = Symbol("viewAction");
const PAN = Symbol("viewAction");

const Markers = {};

export default function Editor(editorElem) {
    loadMarkers();
    const markedItems = [];
    const mouseTracker = MouseTracker();
    const layerWorld = q("#layer-world", editorElem);
    const layerMarker = q("#layer-marker", editorElem);
    let editAction = EDIT_ACTION.EMPTY;
    let viewAction = EMPTY_VA;
    let allowMultiMark = false;
    
    ["mousedown", "mousemove", "mouseup", "mouseleave", "click"]
        .forEach(eType => editorElem.addEventListener(eType, mouseTracker.onEvent));

    function getBoundingRect(elem) {
        const domRect = elem.getBoundingClientRect();
        const editorDomRect = editorElem.getBoundingClientRect();
        return DOMRect.fromRect({x: domRect.x - editorDomRect.x, y: domRect.y - editorDomRect.y, width: domRect.width, height: domRect.height});
    }

    function markItem(item, marker) {
        if (!allowMultiMark) {
            unmarkAll();
        }

        if ("move" === marker) {
            const marker = Markers["move"].cloneNode(true);
            const domRect = getBoundingRect(item);
            const center = getCenter(domRect);
            marker.style.top = `${center.y}px`;
            marker.style.left = `${center.x}px`;
            layerMarker.appendChild(marker);
            markedItems.push([item, marker]);
        }
    }

    function unmarkItem(itemOrMarker) {
        const idxToRemove = markedItems.findIndex(([i, m]) => i === itemOrMarker || m === itemOrMarker);
        if (-1 < idxToRemove) {
            const marker = markedItems[idxToRemove][1];
            marker.remove();
            markedItems.splice(idxToRemove, 1);
        }
    }

    function unmarkAll() {
        while (layerMarker.firstChild) {
            layerMarker.removeChild(layerMarker.firstChild);
        }
        markedItems.length = 0;
    }

    function updateMarkers() {
        markedItems.forEach(([item, marker]) => {
            const domRect = getBoundingRect(item);
            const center = getCenter(domRect);
            marker.style.top = `${center.y}px`;
            marker.style.left = `${center.x}px`;
        });
    }

    return {
        addTracker: mouseTracker.add,
        removeTracker: mouseTracker.remove,
        editAction: action => {
            if (action) {
                editAction = action;
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
        getElem: () => editorElem,
        getWorldMatrix: () => getMatrix(layerWorld),
        setWorldMatrix: matrix => layerWorld.style.transform = matrix,
        getSelectLayer: () => layerMarker,
        getBoundingRect,
        markItem,
        unmarkItem,
        getMarkedItem: marker => {
            const found = markedItems.find(([_, m]) => marker === m);
            return Array.isArray(found) ? found[0] : null;
        },
        updateMarkers,
    }
}

export function panTracker(editor) {
    let isActive = false;
    let matrix = null;
    let startScreenPos = {x: -1, y: -1};
    return {
        id: "pan",
        isActive,
        start: e => {
            return "mousedown" === e.type && (null == findInComposedPath(e, "marker"))
        },
        onStart: e => {
            console.log("pan");
            startScreenPos = {x: e.screenX, y: e.screenY};
            matrix = editor.getWorldMatrix();
        },
        stop: e => "mouseup" === e.type || "mouseleave" === e.type,
        onStop: e => {
            if (matrix != null) {
                editor.setWorldMatrix(matrix.translate(e.screenX - startScreenPos.x, e.screenY - startScreenPos.y, 0));
                editor.updateMarkers();
            }
            startScreenPos = {x: -1, y: -1};
            matrix = null;
        },
        mousemove: e => {
            if (matrix != null) {
                editor.setWorldMatrix(matrix.translate(e.screenX - startScreenPos.x, e.screenY - startScreenPos.y, 0));
                editor.updateMarkers();
            }
        }
    }
}

export function selectTracker(editor) {
    let isActive = false;
    let targetItem = null;

    return {
        id: "select",
        isActive,
        start: e => "click" === e.type && !!(targetItem = findInComposedPath(e, "model", "item")),
        onStart: e => {
            editor.markItem(targetItem, "move");
        },
        stop: e => true,
        onStop: e => {},
    }
}

export function moveTracker(editor) {
    let isActive = false;
    let marker = null;
    let markerMatrix = null;
    let matrix = null;
    let elemToMove = null;
    let startScreenPos = {x: -1, y: -1};

    return {
        id: "move",
        isActive,
        start: e => "mousedown" === e.type && !!(marker = findInComposedPath(e, "marker", "move")),
        onStart: e => {
            console.log("startMove");
            elemToMove = editor.getMarkedItem(marker);
            console.log(elemToMove);
            startScreenPos = {x: e.screenX, y: e.screenY};
            matrix = getMatrix(elemToMove);
            markerMatrix = getMatrix(marker);
        },
        stop: e => "mouseup" === e.type,
        onStop: e => {
            if (matrix != null) {
                elemToMove.style.transform = matrix.translate(e.screenX - startScreenPos.x, e.screenY - startScreenPos.y, 0);
            }
            if (markerMatrix != null) {
                marker.style.transform = markerMatrix.translate(e.screenX - startScreenPos.x, e.screenY - startScreenPos.y, 0);
            }
            elemToMove = null;
            startScreenPos = {x: -1, y: -1};
            matrix = null;
            markerMatrix = null;
        },
        mousemove: e => {
            console.log("move");
            if (matrix != null) {
                elemToMove.style.transform = matrix.translate(e.screenX - startScreenPos.x, e.screenY - startScreenPos.y, 0);
            }
            if (markerMatrix != null) {
                marker.style.transform = markerMatrix.translate(e.screenX - startScreenPos.x, e.screenY - startScreenPos.y, 0);
            }
        }
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
        get: trackerId => trackers.find(t => trackerId === t.id),
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

function findInComposedPath(e, dataAttrName, dataAttrValue = null) {
    return e.composedPath().find(elem => !!elem.dataset && 
        (dataAttrValue == null ? elem.dataset[dataAttrName] != null :  dataAttrValue === elem.dataset[dataAttrName]));
}

function loadMarkers() {
    const template = q("template#markers");
    const clon = template.content.cloneNode(true);
    [...clon.children].forEach(m => Markers[m.dataset.marker] = m);
}

function getCenter(domRect) {
    return {x: domRect.left + Math.abs(domRect.right - domRect.left) / 2, y: domRect.top + Math.abs(domRect.bottom - domRect.top) / 2};
}

function toDiv(domRect) {
    const div = document.createElement("div");
    div.style.position = "absolute";
    div.style.boxSizing = "border-box";
    div.style.border = "2px solid red";
    div.style.top = `${domRect.y}px`;
    div.style.left = `${domRect.x}px`;
    div.style.width = `${domRect.width}px`;
    div.style.height = `${domRect.height}px`;
    return div;
}

function q(selector, from = document) {
    return from.querySelector(selector);
}

function qAll(selector, from = document) {
    return [...from.querySelectorAll(selector)];
}


// const computedStyle = window.getComputedStyle(elem);
            // canvas.width = Math.floor(stripUnit(computedStyle.width));
            // canvas.height = Math.floor(stripUnit(computedStyle.height));


            //canvas.classList.add("overlay");
    //editorElem.appendChild(canvas);
    //const ctx = canvas.getContext("2d");

    // function activateOverlay() {
    //     canvas.style.pointerEvents = "auto";
    // }
    
    // function deactivateOverlay() {
    //     canvas.style.pointerEvents = "none";
    // }
