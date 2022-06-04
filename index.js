class SkyViewState {
    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    constructor(ctx) {

        this.quaternion = Quaternion.identity()
        this.ctx = ctx
        this.pointerLocked = false
        this.needsUpdate = 
        this.refreshRaDec()
        this.ui = new Showing(["crosshairs", "star-names"])
        
        /** @type {SkyObject[]} */ this.objects = []
        /** @type {Star[]} */      this.stars = []

        this.zoom = 1
        this.starFactor = 1
        this.dpr = window.devicePixelRatio || 1
        this.colorSchemes = createColorSchemes(this)
        this.colorSchemeNames = Object.getOwnPropertyNames(this.colorSchemes)
        this.setColorSchemeIndex(3)

    }

    get colors() {
        return this.colorSchemes[this.colorSchemeNames[this.colorSchemeIndex]]
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
    
    refreshRaDec() {
        const targetVector = new Vector(0, 0, -1).transformByQuaternion(
            this.quaternion.inverse())
        this.raDec = positionToRaDec(targetVector)

        this.raRad  = this.raDec.ra  / 12  * Math.PI
        this.decRad = this.raDec.dec / 180 * Math.PI
        this.maxInclusiveAngularDistance = this.getMaxFieldOfViewRad()
    }

    getMaxFieldOfViewRad() {
        const percentOfRadiusVisible = Math.sqrt(
            Math.pow(this.ctx.canvas.width, 2) +
            Math.pow(this.ctx.canvas.height, 2)
        ) / (this.size * 2)
        return percentOfRadiusVisible * Math.PI / 2
    }

    /**
     * @param {Object} raDec
     * @param {number} raDec.ra  - Right ascension in hours
     * @param {number} raDec.dec - Declination in degrees
     */
    raDecIsPossiblyInView(raDec) {
        const { ra, dec } = raDec
        const raRad  = ra  / 12  * Math.PI
        const decRad = dec / 180 * Math.PI
        const distanceFromCenter = Math.sqrt(
            Math.pow(Math.min(
                // Account for discontinuity in RA
                this.raRad  - raRad, 0,
                (2 * Math.PI) - Math.abs(this.raRad - raRad)
            ),  2) * 0 +
            Math.pow(this.decRad - decRad, 2)
        )
        return distanceFromCenter <= this.getMaxFieldOfViewRad() 
    }

    /**
     * @param {string} colorSchemeName
     */
    setColorScheme(colorSchemeName) {
        try {
            const index = this.colorSchemeNames.indexOf(colorSchemeName)
            this.setColorSchemeIndex(index)
        } catch {
            console.warn(`Color scheme "${colorSchemeName}" not found!`)
        }
    }

    /**
     * @param {number} index
     */
    setColorSchemeIndex(index) {
        this.colorSchemeIndex = index
        this.selectedColorScheme = this.colorSchemeNames[index]
        document.body.style.color = this.colors.htmlTextColor
        document.getElementById("stat").style.backgroundColor = 
            this.colors.bgColor
        this.needsUpdate = true
    }

    chooseNextColorScheme() {
        const newIndex = (this.colorSchemeIndex + 1) % 
            this.colorSchemeNames.length
        this.setColorSchemeIndex(newIndex)
    }

    updateGradients() {
        this.colorSchemes = createColorSchemes(this)        
    }

    drawAll() {
        this.objects.forEach(o => o.draw(this))
        this.stars.filter((s) => 
            s.magnitude < this.zoom * 2 * this.starFactor &&
            this.raDecIsPossiblyInView(s.raDec)
        ).forEach(s => s.draw(this))
    }

    /**
     * @param {SkyObject} o
     */
    addObject(o) {
        this.objects.push(o)
    }

    /**
     * @param {Star} s
     */
     addStar(s) {
        this.stars.push(s)
    }
}

class Showing {
    /**
     * @param {Array<string> showing}
     */
    constructor(showing = []) {
        this.showing = showing
    }
    
    /**
     * @param {string} item
     */
    isShowing(item) {
        return this.showing.indexOf(item) >= 0
    }

    /**
     * @param {string} item
     */
    toggle(item) {
        const index = this.showing.indexOf(item)
        if (index >= 0) {
            this.showing.splice(index, 1)
        } else {
            this.showing.push(item)
        }
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
        showPosition(svs)
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
function showPosition(svs) {
    stat(raDecToString(svs.raDec))    
}

/**
 * @param {number} decimal
 */
function decimalToMinutesSeconds(decimal) {
    const minutes = decimal * 60
    const min = Math.floor(minutes)
    const sec = Math.round((minutes - min) * 60) 
    return { min, sec }
}

/**
 * @param {Object} raDec
 * @param {number} raDec.ra
 * @param {number} raDec.dec
 */
function raDecToString(raDec) {
    const { ra, dec } = raDec
    const raH  = Math.floor(ra)
    const decD = Math.floor(dec)
    const raDecimal  = ra  - raH
    const decDecimal = dec - decD
    const { min: raM,  sec: raS  } = decimalToMinutesSeconds(raDecimal)
    const { min: decM, sec: decS } = decimalToMinutesSeconds(decDecimal)
    return `RA ${
        raH.toString().padStart(2, "0")}h ${
        raM.toString().padStart(2, "0")}m ${
        raS.toString().padStart(2, "0")}s ` 
    + `Dec ${
        (decD >= 0) ?  "+" + decD.toString().padStart(2, "0") :
        "-" + decD.toString().substring(1).padStart(2, "0")}\u00b0 ${
        decM.toString().padStart(2, "0")}' ${
        decS.toString().padStart(2, "0")}"`
}

/**
 * @param {SkyViewState} svs
 */
function updateCanvas(svs) {
    if (svs.needsUpdate) {
        clearCanvas(svs)
        svs.refreshRaDec()
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
    ctx.fillStyle = svs.colors.bgColor
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
}

function stat(t) {
    document.getElementById("stat").innerText = t.toString()
}
