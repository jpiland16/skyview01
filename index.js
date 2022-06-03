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
        this.dpr = window.devicePixelRatio || 1
        this.colorSchemes = createColorSchemes(this)
        this.selectedColorScheme = "red-grad"
    }

    get colorScheme() {
        return this.colorSchemes[this.selectedColorScheme]
    }

    get sizeBorderless() {
        return (SV_GREAT_CIRCLE_SIZE / 2 
            - SV_GREAT_CIRCLE_BORDER) * this.zoom * this.dpr
    }

    get size() {
        return SV_GREAT_CIRCLE_SIZE / 2 * this.zoom * this.dpr
    }

    get centerX() {
        return this.ctx.canvas.width / 2  
    }

    get centerY() {   
        return this.ctx.canvas.height / 2 
    }

    updateGradients() {
        this.colorSchemes = createColorSchemes(this)        
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

    loadHYG(svs)

    function animate() {
        handlePressedKeys(keyStates, svs)
        updateCanvas(svs)
        window.requestAnimationFrame(animate)
    }

    window.requestAnimationFrame(animate)

    function onResize() {
        canvas.width = window.innerWidth * svs.dpr
        canvas.height = window.innerHeight * svs.dpr
        svs.updateGradients()
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
        clearCanvas(svs)
        svs.drawAll()
        svs.needsUpdate = false
    }
}

/**
 * @param {SkyViewState} svs
 */
function clearCanvas(svs) {
    const ctx = svs.ctx
    // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.fillStyle = svs.colorScheme.bgColor
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
}

function stat(t) {
    document.getElementById("stat").innerText = t.toString()
}
