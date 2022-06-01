const SV_GREAT_CIRCLE_SIZE = 400
const SV_GREAT_CIRCLE_BORDER = 1
const SV_MERIDIAN_COUNT = 12

// MATH //

/**
 * @param {number} i
 * @param {number} n
 * See: https://stackoverflow.com/questions/14997165/fastest-way-to-get-a-positive-modulo-in-c-c
 */
function positiveModulo(i, n) {
    return (i % n + n) % n
}



//////////

class SkyViewState {
    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    constructor(ctx) {
        this.rotation = 0 // radians
        this.ctx = ctx
        this.pointerLocked = false
    }
}

function loaded() {
    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementById("sky")
    const ctx = canvas.getContext("2d")
    const svs = new SkyViewState(ctx)
    updateCanvas(svs)

    // addSlider("Rotation", -360, 360, 0, (deg) => {
    //     const rad = deg * Math.PI / 180
    //     svs.rotation = rad
    //     updateCanvas(svs)
    // })

    canvas.onclick = function() {
        canvas.requestPointerLock();
    };
    document.addEventListener('pointerlockchange', (e) => {
        svs.pointerLocked = (document.pointerLockElement === canvas)
    } , false)

    document.addEventListener('mousemove', (e) => {
        onMouseMove(svs, e)
    }, false)
}

/**
 * @param {SkyViewState} svs
 * @param {MouseEvent} e
 */
function onMouseMove(svs, e) {
    if (svs.pointerLocked) {
        svs.rotation -= e.movementX / 100
        updateCanvas(svs)
    }
}

/**
 * @param {SkyViewState} svs
 */
function updateCanvas(svs) {
    clearCanvas(svs.ctx)
    drawMeridians(svs)
    drawEarthOutline(svs)
}

/**
 * @param {SkyViewState} svs
 */
function drawEarthOutline(svs) {
    const ctx = svs.ctx
    ctx.beginPath()
    ctx.ellipse(
        SV_GREAT_CIRCLE_SIZE / 2, 
        SV_GREAT_CIRCLE_SIZE / 2, 
        SV_GREAT_CIRCLE_SIZE / 2 - 2 * SV_GREAT_CIRCLE_BORDER, 
        SV_GREAT_CIRCLE_SIZE / 2 - 2 * SV_GREAT_CIRCLE_BORDER, 
        0, 0, 2 * Math.PI
    );
    ctx.stroke()
}

/**
 * @param {SkyViewState} svs
 * @param {number} size
 * @param {number} count
 */
function drawMeridians(svs) {
    const ctx = svs.ctx
    const rot = svs.rotation
    const radianSep = 2 * Math.PI / SV_MERIDIAN_COUNT

    for (let i = 0; i < SV_MERIDIAN_COUNT; i++) {
        // Draw ellipse
        ctx.beginPath();
        const meridianAngle = rot + radianSep * i
        if (positiveModulo(meridianAngle, 2 * Math.PI) < Math.PI) {
            const minorAxisScale = Math.cos(meridianAngle)
            if (minorAxisScale < 0) {
                ctx.ellipse(
                    SV_GREAT_CIRCLE_SIZE / 2, 
                    SV_GREAT_CIRCLE_SIZE / 2, 
                 - (SV_GREAT_CIRCLE_SIZE / 2 - 2 * SV_GREAT_CIRCLE_BORDER) 
                        * minorAxisScale, 
                    SV_GREAT_CIRCLE_SIZE / 2 - 2 * SV_GREAT_CIRCLE_BORDER, 
                    0, - Math.PI / 2, Math.PI / 2
                );
            } else {
                ctx.ellipse(
                    SV_GREAT_CIRCLE_SIZE / 2, 
                    SV_GREAT_CIRCLE_SIZE / 2, 
                   (SV_GREAT_CIRCLE_SIZE / 2 - 2 * SV_GREAT_CIRCLE_BORDER) 
                        * minorAxisScale, 
                    SV_GREAT_CIRCLE_SIZE / 2 - 2 * SV_GREAT_CIRCLE_BORDER, 
                    0, Math.PI / 2, 3 * Math.PI / 2
                );
            }
        }
        ctx.stroke();
    }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 */
function clearCanvas(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
}

/**
 * @param {string} label
 * @param {number} min - minimum value of slider
 * @param {number} max - maximum value of slider
 * @param {number} value - initial value of slider
 * @param {function} onChange - function called when value changes
 * @param {number} step - if 0, continuous, otherwise discrete
 */
function addSlider(label, min, max, value, 
        onChange = () => {}, step = 0) {

    const hostDiv = document.getElementById("sliders")
    const tr = document.createElement("tr")
    const td1 = document.createElement("td")
    const td2 = document.createElement("td")
    
    td1.innerText = label

    const slider = document.createElement("input")

    slider.type = "range"
    slider.min = min
    slider.max = max
    slider.value = value
    if (step !== 0) slider.step = step; else step = "any"
    slider.oninput = (e) => onChange(e.target.value)

    hostDiv.appendChild(tr)
    tr.appendChild(td1)
    tr.appendChild(td2)
    td2.appendChild(slider)
}