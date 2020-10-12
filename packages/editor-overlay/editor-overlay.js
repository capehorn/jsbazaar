

export default function Editor(elem) {
    const mouseTracker = MouseTracker();
    let editAction = null; //none, add line, move line, ....
    let viewAction = null; //none, zoom, pan

    editor.addEventListener("mousedown", mouseTracker.onEvent);
    editor.addEventListener("mousemove", mouseTracker.onEvent);
    editor.addEventListener("mouseup", mouseTracker.onEvent);

    const canvas = document.createElement("canvas");

    let ctx = null;

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
        inAction: () => editAction != null || viewAction != null,
        activateOverlay() {
            const computedStyle = window.getComputedStyle(editor);
            canvas.width = Math.floor(stripUnit(computedStyle.width));
            canvas.height = Math.floor(stripUnit(computedStyle.height));
            elem.appendChild(canvas);
            ctx = canvas.getContext("2d");
        },
        deactivateOverlay() {
            canvas.remove();
        },
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

        onEvent(e) {
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

function stripUnit(value) {
    return value.slice(0, -2);
}
