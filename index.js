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
 * @param {CanvasRenderingContext2D} ctx
 */
function clearCanvas(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
}

function stat(t) {
    document.getElementById("stat").innerText = t.toString()
}
