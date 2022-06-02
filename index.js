const SV_GREAT_CIRCLE_SIZE = 500
const SV_GREAT_CIRCLE_BORDER = 1
const SV_MERIDIAN_COUNT = 4
const SV_PARALLEL_COUNT = 11
const SV_MOVEMENT_SCALE = 100
const SV_KEY_MOVEMENT_SCALE = 25
const SV_WHEEL_SCALE = 0.95
const SV_KEY_ZOOM_SCALE = 0.98
const SV_MIN_ZOOM = 0.5
const SV_MAX_ZOOM = Infinity
const SV_CROSSHAIR_SIZE = 35
const SV_CROSSHAIR_SPACE = 7

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

    toString() {
        return `(${this.x}, ${this.y}, ${this.z})`
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

class CrossHairs extends SkyObject {
    /**
     * @override
     * 
     * @param {SkyViewState} svs 
     */
    draw(svs) {
        const ctx = svs.ctx
        const xCenter = svs.centerX
        const yCenter = svs.centerY
        ctx.beginPath()
        // UP
        ctx.moveTo(xCenter, yCenter - SV_CROSSHAIR_SPACE)
        ctx.lineTo(xCenter, yCenter - SV_CROSSHAIR_SIZE)
        // DOWN
        ctx.moveTo(xCenter, yCenter + SV_CROSSHAIR_SPACE)
        ctx.lineTo(xCenter, yCenter + SV_CROSSHAIR_SIZE)
        // LEFT
        ctx.moveTo(xCenter - SV_CROSSHAIR_SPACE, yCenter)
        ctx.lineTo(xCenter - SV_CROSSHAIR_SIZE, yCenter)
        // RIGHT
        ctx.moveTo(xCenter + SV_CROSSHAIR_SPACE, yCenter)
        ctx.lineTo(xCenter + SV_CROSSHAIR_SIZE, yCenter)
        ctx.strokeStyle = svs.pointerLocked ? "red" : "gray"
        ctx.lineWidth = 0.5
        ctx.stroke()
    }
}

class EarthCircle extends SkyObject {
    /**
     * @override
     * 
     * @param {SkyViewState} svs 
     */
    draw(svs) {
        const ctx = svs.ctx
        ctx.beginPath()
        ctx.ellipse(
            svs.centerX, 
            svs.centerY, 
            svs.sizeBorderless + 1, 
            svs.sizeBorderless + 1, 
            0, 0, 2 * Math.PI
        );
        ctx.strokeStyle = "black"
        ctx.lineWidth = 2
        ctx.stroke()
    }
}

class SkyMeridian extends SkyObject {
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
            svs.quaternion).scale(svs.sizeBorderless)

        const majorAxisLength = 1 * (svs.sizeBorderless)
        const minorAxisLength = Math.abs(normalTransformed.getCosineDistance(
            new Vector(0, 0, 1))) * (svs.sizeBorderless)
        
        const normalCollapsed = normalTransformed.collapseToXY()

        const negator = (normalCollapsed.y > 0) ? -1 : 1

        const angle = positiveModulo(
            normalCollapsed.length === 0 ? 0 :
                normalCollapsed.getAngleTo(new Vector(-1, 0, 0)) * negator,
            Math.PI
        )
        
        let startAngle = - Math.PI / 2
        let stopAngle = Math.PI / 2
        if ((normalTransformed.z * normalTransformed.x > 0 && angle > Math.PI / 2) || (normalTransformed.z * normalTransformed.x < 0 && angle < Math.PI / 2)) {
            startAngle += Math.PI
            stopAngle  += Math.PI
        }

        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.ellipse(
            svs.centerX, 
            svs.centerY, 
            minorAxisLength, 
            majorAxisLength, 
            angle,
            startAngle, stopAngle
            // 0, 2 * Math.PI
        );
        ctx.strokeStyle = "black"
        ctx.lineWidth = 1
        ctx.stroke()
    }
}

class SkyParallel extends SkyObject {
    /**
     * @param {number} latitude - latitude above the equator, in radians
     */
    constructor(latitude) {
        super()
        this.latitude = latitude
        this.positionVector = new Vector(0, - Math.sin(latitude), 0)
    }

    /**
     * @override
     * 
     * @param {SkyViewState} svs
     */
    draw(svs) {

        const ctx = svs.ctx

        const normalTransformed = new Vector(0, -1, 0).transformByQuaternion(
            svs.quaternion)

        const majorAxisLength = Math.cos(this.latitude) * (
            svs.sizeBorderless - SV_GREAT_CIRCLE_BORDER)
        const minorAxisLength = Math.abs(normalTransformed.getCosineDistance(
            new Vector(0, 0, 1))) * Math.cos(this.latitude) * (
                svs.sizeBorderless - SV_GREAT_CIRCLE_BORDER)
        
        const normalCollapsed = normalTransformed.collapseToXY()

        const positionTransformed = this.positionVector.transformByQuaternion(
            svs.quaternion).scale(svs.size)

        const negator = (normalCollapsed.y > 0) ? -1 : 1

        const angle = positiveModulo(
            normalCollapsed.length === 0 ? 0 :
                normalCollapsed.getAngleTo(new Vector(-1, 0, 0)) * negator,
            Math.PI
        )

        const axisTilt = Math.PI / 2 - new Vector(0, -1, 0).transformByQuaternion(
            svs.quaternion
        ).getAngleTo(new Vector(0, 0, 1))
                    
        let versin = Math.cos(this.latitude + axisTilt) / Math.cos(axisTilt)
        let angleSubtended;

        if (versin < 0) angleSubtended = 0;
        else if (versin > 2 * Math.cos(this.latitude)) angleSubtended = Math.PI;
        else angleSubtended = Math.acos(1 - (versin / Math.cos(this.latitude)))

        let startAngle = - angleSubtended
        let stopAngle = angleSubtended

        
        if ((normalTransformed.z * normalTransformed.x > 0 && angle > Math.PI / 2) || (normalTransformed.z * normalTransformed.x < 0 && angle < Math.PI / 2)) {
            // startAngle += Math.PI
            // stopAngle  += Math.PI
        }

        if (normalTransformed.z * normalTransformed.y < 0) {
            startAngle += Math.PI
            stopAngle  += Math.PI
        }

        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.ellipse(
            svs.centerX + positionTransformed.x, 
            svs.centerY + positionTransformed.y, 
            minorAxisLength, 
            majorAxisLength, 
            angle, startAngle, stopAngle
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
            svs.quaternion).scale(svs.sizeBorderless)
        ctx.beginPath()
        ctx.moveTo(svs.centerX, svs.centerY)
        ctx.lineTo(
            endpointTransformed.x + svs.centerX, 
            endpointTransformed.y + svs.centerY
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
        this.needsUpdate = true
        /** @type {SkyObject[]} */
        this.objects = []
        this.zoom = 1
    }

    get sizeBorderless() {
        return (SV_GREAT_CIRCLE_SIZE / 2 
            - 2 * SV_GREAT_CIRCLE_BORDER) * this.zoom
    }

    get size() {
        return SV_GREAT_CIRCLE_SIZE / 2 * this.zoom
    }

    get centerX() {
        return this.ctx.canvas.width / 2
    }

    get centerY() {   
        return this.ctx.canvas.height / 2
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

    const keyStates = {}

    window.svs = svs

    createMeridians(svs)
    createParallels(svs)
    svs.addObject(new EarthCircle())
    svs.addObject(new CrossHairs())

    function animate() {
        handlePressedKeys(keyStates, svs)
        updateCanvas(svs)
        window.requestAnimationFrame(animate)
    }
    window.requestAnimationFrame(animate)

    function onResize() {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        svs.needsUpdate = true
    }

    canvas.onclick = function() {
        canvas.requestPointerLock();
    };
    document.addEventListener('pointerlockchange', (e) => {
        svs.pointerLocked = (document.pointerLockElement === canvas)
        svs.needsUpdate = true
    } , false)

    document.addEventListener('mousemove', (e) => {
        onMouseMove(svs, e)
    }, false)

    document.addEventListener('keyup', (e) => keyStates[e.key] = false, false)
    document.addEventListener('keydown', (e) => keyStates[e.key] = true, false)
    document.addEventListener('keypress', (e) => handleKeyPress(e, svs), false)
    document.addEventListener("wheel", (e) => handleScroll(e, svs), false)
    window.addEventListener('resize', (e) => onResize(), false)

    onResize()
}

/**
 * @param {KeyboardEvent} e
 * @param {SkyViewState} svs
 */
function handleKeyPress(e, svs) {
    if (svs.pointerLocked) {
        if (e.key === "0") {
            svs.quaternion = Quaternion.identity()
            svs.needsUpdate = true
        }
    }
}

/**
 * @param {Object<string, boolean>} keyStates
 * @param {SkyViewState} svs
 */
function handlePressedKeys(keyStates, svs) {
    if (svs.pointerLocked) {
        const scale = 1 / SV_KEY_MOVEMENT_SCALE / svs.zoom
        if (keyStates[","] && !keyStates["."]) {
            const zRotationQuaternion = Quaternion.fromAxisAngle(
                0, 0, 1, scale)
            svs.quaternion = svs.quaternion.multiply(zRotationQuaternion)
            svs.needsUpdate = true
        }  
        if (keyStates["."] && !keyStates[","]) {
            const zRotationQuaternion = Quaternion.fromAxisAngle(
                0, 0, 1, - scale)
            svs.quaternion = svs.quaternion.multiply(zRotationQuaternion)
            svs.needsUpdate = true
        }
        if (keyStates["ArrowUp"] && !keyStates["ArrowDown"]) {
            const xRotationQuaternion = Quaternion.fromAxisAngle(
                1, 0, 0, - scale)
            svs.quaternion = svs.quaternion.multiply(xRotationQuaternion)
            svs.needsUpdate = true
        } 
        if (keyStates["ArrowDown"] && !keyStates["ArrowUp"]) {
            const xRotationQuaternion = Quaternion.fromAxisAngle(
                1, 0, 0, scale)
            svs.quaternion = svs.quaternion.multiply(xRotationQuaternion)
            svs.needsUpdate = true
        }
        if (keyStates["ArrowLeft"] && !keyStates["ArrowRight"]) {
            const yRotationQuaternion = Quaternion.fromAxisAngle(
                0, 1, 0, scale)
            svs.quaternion = svs.quaternion.multiply(yRotationQuaternion)
            svs.needsUpdate = true
        } 
        if (keyStates["ArrowRight"] && !keyStates["ArrowLeft"]) {
            const yRotationQuaternion = Quaternion.fromAxisAngle(
                0, 1, 0, - scale)
            svs.quaternion = svs.quaternion.multiply(yRotationQuaternion)
            svs.needsUpdate = true
        }
        const zoomScale = SV_KEY_ZOOM_SCALE
        if (keyStates["z"] && !keyStates["x"]) {
            svs.zoom /= zoomScale
            svs.zoom = Math.min(Math.max(SV_MIN_ZOOM, svs.zoom), SV_MAX_ZOOM)
            svs.needsUpdate = true
        }
        if (keyStates["x"] && !keyStates["z"]) {
            svs.zoom *= zoomScale
            svs.zoom = Math.min(Math.max(SV_MIN_ZOOM, svs.zoom), SV_MAX_ZOOM)
            svs.needsUpdate = true
        }
    }
}

/**
 * @param {WheelEvent} e 
 * @param {SkyViewState} svs
 */
function handleScroll(e, svs) {
    if (svs.pointerLocked && e.deltaY != 0) {
        const scalingFactor = e.deltaY < 0 ? 1 / SV_WHEEL_SCALE : SV_WHEEL_SCALE
        svs.zoom *= scalingFactor
        svs.zoom = Math.min(Math.max(SV_MIN_ZOOM, svs.zoom), SV_MAX_ZOOM)
        svs.needsUpdate = true
    }
}

/**
 * @param {SkyViewState} svs
 * @param {MouseEvent} e
 */
function onMouseMove(svs, e) {

    if (svs.pointerLocked) {

        const xRotationQuaternion = Quaternion.fromAxisAngle(
            1, 0, 0, e.movementY / SV_MOVEMENT_SCALE / svs.zoom)
        const yRotationQuaternion = Quaternion.fromAxisAngle(
            0, 1, 0, - e.movementX / SV_MOVEMENT_SCALE / svs.zoom)

        svs.quaternion = svs.quaternion.multiply(
            xRotationQuaternion).multiply(yRotationQuaternion)
        svs.needsUpdate = true
    }

}

/**
 * @param {SkyViewState} svs
 */
function updateCanvas(svs) {
    if (svs.needsUpdate) {
        clearCanvas(svs.ctx)
        svs.drawAll()
        svs.needsUpdate = false
    }
}

/**
 * @param {SkyViewState} svs
 */
function createMeridians(svs) {

    radSep = Math.PI / SV_MERIDIAN_COUNT

    for (let i = 0; i < SV_MERIDIAN_COUNT; i++) {
        const angle = radSep * i
        const normal = new Vector(Math.cos(angle), 0, Math.sin(angle))
        svs.addObject(new SkyMeridian(normal))
    }
}

/**
 * @param {SkyViewState} svs
 */
 function createParallels(svs) {

    radSep = Math.PI / (SV_PARALLEL_COUNT + 1)

    for (let i = 1; i <= SV_PARALLEL_COUNT; i++) {
        const angle = radSep * i - Math.PI / 2
        svs.addObject(new SkyParallel(angle))
    }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 */
function clearCanvas(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
}

function stat(t) {
    document.getElementById("stat").innerText = t.toString()
}

window.stat = stat