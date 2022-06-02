const SV_GREAT_CIRCLE_SIZE = 450
const SV_GREAT_CIRCLE_BORDER = 1
const SV_MERIDIAN_COUNT = 4
const SV_MOVEMENT_SCALE = 100

//// MATH ///
// #region //

/**
 * @param {number} i
 * @param {number} n
 * See: https://stackoverflow.com/questions/14997165/fastest-way-to-get-a-positive-modulo-in-c-c
 */
function positiveModulo(i, n) {
    return (i % n + n) % n
}

class Vector {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    constructor(x, y, z) {
        this.x = x
        this.y = y
        this.z = z
    }

    get length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2))
    }

    /**
     * Returns a new vector resulting from scaling this vector down by 
     * a factor of `r`. Does not change the original vector.
     * 
     * @param {number} r
     */
    scale(r) {
        return new Vector(this.x * r, this.y * r, this.z * r)
    }

    toQuaternion() {
        return new Quaternion(this.x, this.y, this.z, 0)
    }

    /**
     * Transform this vector using the quaternion `q`.
     * 
     * @param {Quaternion} q
     */
    transformByQuaternion(q) {
        return q.inverse().multiply(this.toQuaternion()).multiply(q).vectorPart
    }
    
    collapseToXY() {
        return new Vector(this.x, this.y, 0)
    }

    /**
     * Calculates the dot product of this vector and `o`.
     * 
     * @param {Vector} o
     */
    dotProduct(o) {
        return this.x * o.x + this.y * o.y + this.z * o.z
    }

    /**
     * Calculates the cosine distance between this vector and `o`.
     * 
     * @param {Vector} o
     */
    getCosineDistance(o) {
        const dotProduct = this.dotProduct(o)
        const lengthProduct = this.length * o.length
        return dotProduct / lengthProduct
    }
    
    /**
     * Gets the angle between this vector and `o`.
     * 
     * @param {Vector} o
     */
    getAngleTo(o) {
        return Math.acos(this.getCosineDistance(o))
    }
}

class Quaternion {

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} w
     */
    constructor(x, y, z, w) {
        this.x = x
        this.y = y
        this.z = z
        this.w = w
    }

    static identity() {
        return new Quaternion(0, 0, 0, 1)
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} theta - angle in radians
     */
    static fromAxisAngle(x, y, z, theta) {
        return new Quaternion(
            x * Math.sin(theta / 2),
            y * Math.sin(theta / 2),
            z * Math.sin(theta / 2),
            Math.cos(theta / 2)
        )
    }

    /**
     * Returns the result of multiplying quaternions `a` times `b`.
     * Does not change either quaternion.
     * 
     * @param {Quaternion} a
     * @param {Quaternion} b
     */
    static multiply(a, b) {
        return new Quaternion(
            (a.x * b.w) + (a.w * b.x) + (a.y * b.z) - (a.z * b.y),
            (a.y * b.w) + (a.w * b.y) + (a.z * b.x) - (a.x * b.z),
            (a.z * b.w) + (a.w * b.z) + (a.x * b.y) - (a.y * b.x),
            (a.w * b.w) - (a.x * b.x) - (a.y * b.y) - (a.z * b.z)
        )
    }

    get magnitude() {
        return Math.sqrt(
            Math.pow(this.x, 2) +
            Math.pow(this.y, 2) +
            Math.pow(this.z, 2) +
            Math.pow(this.w, 2)
        )
    }

    /**
     * Returns the result of multiplying this quaternion times `o`.
     * Does not change either quaternion.
     * 
     * @param {Quaternion} o
     */
    multiply(o) {
        return Quaternion.multiply(this, o)
    }

    /**
     * Returns the result of multiplying `o` times this quaternion.
     * Does not change either quaternion.
     * 
     * @param {Quaternion} o
     */
    premultiply(o) {
        return Quaternion.multiply(o, this)
    }

    inverse() {
        return new Quaternion(
            - this.x,
            - this.y,
            - this.z,
              this.w
        )
    }

    toAxisAngle() {
        const angle = 2 * Math.acos(this.w)
        const axis = new Vector(this.x, this.y, this.z).scale(
            1 / Math.sin(angle / 2))
        return { axis, angle }
    }

    get vectorPart() {
        return new Vector(this.x, this.y, this.z)
    }
}

///////////// 
// #endregion

// DRAWING //
// #region //

class SkyObject {
    /**
     * Draws the object using the given context and SkyView state.
     * 
     * @param {SkyViewState} svs
     */
    draw(svs) {
        const ctx = svs.ctx
        // Code to draw object goes here (override)
    }
}

class SkyCircle extends SkyObject {
    /**
     * @param {Vector} normal
     */
    constructor(normal) {
        super()
        this.normal = normal
    }

    /**
     * @override
     * 
     * @param {SkyViewState} svs
     */
    draw(svs) {

        const ctx = svs.ctx

        const normalTransformed = this.normal.transformByQuaternion(
            svs.quaternion)

        const majorAxisLength = 1 * (
            SV_GREAT_CIRCLE_SIZE / 2 - SV_GREAT_CIRCLE_BORDER)
        const minorAxisLength = Math.abs(normalTransformed.getCosineDistance(
            new Vector(0, 0, 1))) * (
                SV_GREAT_CIRCLE_SIZE / 2 - SV_GREAT_CIRCLE_BORDER)
        
        const normalCollapsed = normalTransformed.collapseToXY()

        const angle = normalCollapsed.length === 0 ? 0 :
            normalCollapsed.getAngleTo(new Vector(-1, 0, 0))

        const negator = (normalCollapsed.y > 0) ? -1 : 1

        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.ellipse(
            SV_GREAT_CIRCLE_SIZE / 2, 
            SV_GREAT_CIRCLE_SIZE / 2, 
            minorAxisLength, 
            majorAxisLength, 
            negator * positiveModulo(angle, Math.PI), 0, 2 * Math.PI
        );
        ctx.strokeStyle = "black"
        ctx.lineWidth = 1
        ctx.stroke()
    }
}

class SkyRadius extends SkyObject {
    /**
     * @param {Vector} endpoint
     * @param {string} color
     */
    constructor(endpoint, color = "black") {
        super()
        this.endpoint = endpoint
        this.color = color
    }

    /**
     * @override
     * 
     * @param {SkyViewState} svs
     */
     draw(svs) {
        const ctx = svs.ctx
        const endpointTransformed = this.endpoint.transformByQuaternion(
            svs.quaternion)
        ctx.beginPath()
        ctx.moveTo(SV_GREAT_CIRCLE_SIZE / 2, SV_GREAT_CIRCLE_SIZE / 2)
        ctx.lineTo(
            endpointTransformed.x + SV_GREAT_CIRCLE_SIZE / 2, 
            endpointTransformed.y + SV_GREAT_CIRCLE_SIZE / 2
        )
        if (endpointTransformed.z > 0) ctx.lineWidth = 3; else ctx.lineWidth = 1
        ctx.strokeStyle = this.color
        ctx.stroke()
     }
}

////////////////
// #endregion //

class SkyViewState {
    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    constructor(ctx) {
        this.quaternion = Quaternion.identity()
        this.ctx = ctx
        this.pointerLocked = false
        /** @type {SkyObject[]} */
        this.objects = []
    }

    drawAll() {
        for (const obj of this.objects) { obj.draw(this) }
    }

    /**
     * @param {SkyObject} o
     */
    addObject(o) {
        this.objects.push(o)
    }
}

function loaded() {
    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementById("sky")
    const ctx = canvas.getContext("2d")
    const svs = new SkyViewState(ctx)

    window.svs = svs

    createMeridians(svs)
    svs.addObject(new SkyRadius(new Vector(0, 0, -1).scale(
        SV_GREAT_CIRCLE_SIZE / 2), "red"))
    svs.addObject(new SkyRadius(new Vector(0, -1, 0).scale(
        SV_GREAT_CIRCLE_SIZE / 2), "green"))
    svs.addObject(new SkyRadius(new Vector(1, 0, 0).scale(
        SV_GREAT_CIRCLE_SIZE / 2), "blue"))

    updateCanvas(svs)

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

        const xRotationQuaternion = Quaternion.fromAxisAngle(
            1, 0, 0, e.movementY / SV_MOVEMENT_SCALE)
        const yRotationQuaternion = Quaternion.fromAxisAngle(
            0, 1, 0, - e.movementX / SV_MOVEMENT_SCALE)

        svs.quaternion = svs.quaternion.multiply(
            xRotationQuaternion).multiply(yRotationQuaternion)
        updateCanvas(svs)
    }

}

/**
 * @param {SkyViewState} svs
 */
function updateCanvas(svs) {
    clearCanvas(svs.ctx)
    svs.drawAll()
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
    ctx.strokeStyle = "black"
    ctx.lineWidth = 1
    ctx.stroke()
}

/**
 * @param {SkyViewState} svs
 */
function createMeridians(svs) {

    radSep = Math.PI / SV_MERIDIAN_COUNT

    for (let i = 0; i < SV_MERIDIAN_COUNT; i++) {
        const angle = radSep * i
        const normal = new Vector(Math.cos(angle), 0, Math.sin(angle)).scale(
            SV_GREAT_CIRCLE_SIZE / 2 - 2 * SV_GREAT_CIRCLE_BORDER)
        // svs.addObject(new SkyRadius(normal))
        svs.addObject(new SkyCircle(normal))
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