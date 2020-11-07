

export const EDIT_ACTION = {
    EMPTY: Symbol("editAction"),
    SELECT: Symbol("editAction")
}

const EMPTY_VA = Symbol("viewAction");
const ZOOM = Symbol("viewAction");
const PAN = Symbol("viewAction");

export default function Editor(editorElem) {
    const Markers = loadFromTemplate("template#markers", "marker");
    const Items = loadFromTemplate("template#model-items", "model");
    //camera matrix
    const CM = new DOMMatrix();
    const WM = new DOMMatrix();
    const markedItems = [];
    const mouseTracker = MouseTracker();
    const worldLayer = q("#layer-world", editorElem);
    const markerLayer = q("#layer-marker", editorElem);
    let editAction = EDIT_ACTION.EMPTY;
    let viewAction = EMPTY_VA;
    let allowMultiMark = false;
    
    ["mousedown", "mousemove", "mouseup", "mouseenter", "mouseleave", "click", "wheel"]
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
            markerLayer.appendChild(marker);
            setMarkerTransform(marker, `translate(${center.x}px, ${center.y}px)`);
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
        while (markerLayer.firstChild) {
            markerLayer.removeChild(markerLayer.firstChild);
        }
        markedItems.length = 0;
    }

    function updateMarkers() {
        markedItems.forEach(([item, marker]) => {
            const domRect = getBoundingRect(item);
            const center = getCenter(domRect);
            setMarkerTransform(marker, `translate(${center.x}px, ${center.y}px)`);
        });  
    }

    function setWorldMatrix(matrix) {
        setFromMatrix(matrix, WM);
    }

    function applyCameraMatrix(matrix) {
        setFromMatrix(matrix, CM);
        worldLayer.style.transform = CM.multiply(WM);
    }

    function getWorldLayerMatrix(){
        return getMatrix(worldLayer);
    }

    function addModelItems(items) {
        const LM = getWorldLayerMatrix();
        items.forEach(item => {
            const node = Items[item.type].cloneNode(true);
            node.style.transform = new DOMMatrix().setMatrixValue(`translate(${item.x}px, ${item.y}px)`).preMultiplySelf(LM);
            if (item.data) {
                Object.entries(item.data).forEach(([k, v]) => node.dataset[k] = v);
            }
            worldLayer.appendChild(node);
        });
    }

    function getEditorPoint(screenPoint) {
        const editorDomRect = editorElem.getBoundingClientRect();
        return new DOMPointReadOnly(screenPoint.x - editorDomRect.x, screenPoint.y - editorDomRect.y);
    }

    function getWorldPoint(screenPoint) {
        return CM.multiply(WM).transformPoint(getEditorPoint(screenPoint));
    }

    return {
        addModelItems,
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
        getWorldLayerMatrix,
        setWorldMatrix,
        initWorldMatrix: transform => setWorldMatrix(new DOMMatrix().setMatrixValue(transform)),
        initCameraMatrix: transform => applyCameraMatrix(new DOMMatrix().setMatrixValue(transform)),
        getCameraMatrix: () => DOMMatrix.fromMatrix(CM),
        applyCameraMatrix,
        getSelectLayer: () => markerLayer,
        getBoundingRect,
        markItem,
        unmarkItem,
        getMarkedItem: marker => {
            const found = markedItems.find(([_, m]) => marker === m);
            return Array.isArray(found) ? found[0] : null;
        },
        updateMarkers,
        getWorldPoint,
        getEditorPoint,
    }
}

export function posTracker(editor, override) {
    let isActive = false;
    return {
        id: "pos",
        isActive,
        start: e => "mousemove" === e.type,
        onStart: e => {},
        stop: e => "mouseleave" === e.type,
        onStop: e => {},
        ...override
    }
}

export function panTracker(editor) {
    let isActive = false;
    let cm = null;
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
            cm = editor.getCameraMatrix();
        },
        stop: e => "mouseup" === e.type || "mouseleave" === e.type,
        onStop: e => {
            if (cm != null) {
                editor.applyCameraMatrix(cm.translate(e.screenX - startScreenPos.x, e.screenY - startScreenPos.y, 0));
                editor.updateMarkers();
            }
            startScreenPos = {x: -1, y: -1};
            cm = null;
        },
        mousemove: e => {
            if (cm != null) {
                editor.applyCameraMatrix(cm.translate(e.screenX - startScreenPos.x, e.screenY - startScreenPos.y, 0));
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
        start: e => "click" === e.type && !!(targetItem = findInComposedPath(e, "react", "select")),
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
            marker = null;
        },
        mousemove: e => {
            if (matrix != null) {
                elemToMove.style.transform = matrix.translate(e.screenX - startScreenPos.x, e.screenY - startScreenPos.y, 0);
            }
            if (markerMatrix != null) {
                marker.style.transform = markerMatrix.translate(e.screenX - startScreenPos.x, e.screenY - startScreenPos.y, 0);
            }
        }
    }
}

export function zoomTracker(editor) {
    let isActive = false;
    let cm = null;
    let startScreenPos = {x: -1, y: -1};
    return {
        id: "zoom",
        isActive,
        start: e => "wheel" === e.type,
        onStart: e => {
            console.log("zoom");
            startScreenPos = {x: e.screenX, y: e.screenY};
            cm = editor.getCameraMatrix();
        },
        stop: e => true,
        onStop: e => {
            if (cm != null) {
                const worldPoint = editor.getWorldPoint(startScreenPos);
                console.log(worldPoint);
                const sign = Math.sign(e.deltaY);
                const ratio = 1 + (sign * 0.5);
                editor.applyCameraMatrix(cm.scale(ratio, ratio, 1, worldPoint.x, worldPoint.y, 0));
            }
            startScreenPos = {x: -1, y: -1};
            cm = null;
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

function getComputedStyle(elem) {
    return window.getComputedStyle(elem);
}

function extractNum(value) {
    return parseFloat(value.slice(0, -2));
}

function stripUnit(value) {
    return value.slice(0, -2);
}

function getMatrix(elem) {
    const transform = getComputedStyle(elem).transform;
    if (transform === "none" || transform === undefined || transform === null || transform === "") {
        return new DOMMatrix();
    } else {
        const matrixValues = transform.split('(')[1].split(')')[0].split(', ');
        return initFromArray(matrixValues);
    }
}

function setMarkerTransform(marker, transformString) {
    const cs = window.getComputedStyle(marker);
    marker.style.transform = getMatrix(marker)
        .setMatrixValue(transformString + ` translate(${-1 * extractNum(cs.width)/2}px, ${-1 * extractNum(cs.height)/2}px)`);
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

function loadFromTemplate(selector, dataAttrName) {
    const items = {};
    const template = q(selector);
    const clon = template.content.cloneNode(true);
    [...clon.children].forEach(item => items[item.dataset[dataAttrName]] = item);
    return items;
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

function setFromMatrix(src, dest) {
    ["m11", "m12", "m13", "m14", "m21", "m22", "m23", "m24", "m31", "m32", "m33", "m34", "m41", "m42", "m43", "m44"]
    .forEach(v => dest[v] = src[v]);
}
