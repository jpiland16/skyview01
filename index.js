class SkyViewState {
    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    constructor(ctx) {

        this.quaternion = Quaternion.fromString(localStorage.getItem(
            "quaternion")) || Quaternion.identity()
        this.ctx = ctx
        this.pointerLocked = false
        this.needsUpdate = 
        this.refreshRaDec()
        this.ui = new UI([
            "crosshairs", "star-names", "star-sizes", "globe", "stars",
            "constellation-boundaries"
        ])
        
        /** @type {SkyObject[]} */ this.objects = []
        /** @type {Star[]} */      this.stars = []

        this.zoom = Number(localStorage.getItem("zoom")) || 1
        this.starFactor = 1
        this.dpr = window.devicePixelRatio || 1
        this.colorSchemes = createColorSchemes(this)
        this.colorSchemeNames = Object.getOwnPropertyNames(this.colorSchemes)
        this.setColorScheme(localStorage.getItem("colorSchemeName") || "red-grad")

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
        const colorSchemeName = this.colorSchemeNames[index]
        localStorage.setItem("colorSchemeName", colorSchemeName)
        this.selectedColorScheme = colorSchemeName
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

    choosePrevColorScheme() {
        const newIndex = positiveModulo((this.colorSchemeIndex - 1),
            this.colorSchemeNames.length)
        this.setColorSchemeIndex(newIndex)
    }

    updateGradients() {
        this.colorSchemes = createColorSchemes(this)        
    }

    drawAll() {
        this.objects.forEach(o => o.draw(this))
        if (!this.ui.has("stars")) return
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

class UI {
    /**
     * @param {Array<string> showing}
     */
    constructor(properties = []) {
        this.properties = properties
    }
    
    /**
     * @param {string} item
     */
    has(item) {
        return this.properties.indexOf(item) >= 0
    }

    /**
     * @param {string} item
     */
    toggle(item) {
        const index = this.properties.indexOf(item)
        if (index >= 0) {
            this.properties.splice(index, 1)
        } else {
            this.properties.push(item)
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
    loadConstBnd(svs)

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
        window.setTimeout(() => {
            if (document.pointerLockElement !== canvas) {
                // Occurs if the user clicks too quickly after exiting lock
                alert("Pointer not captured - click again to begin navigation")
            }
        }, 100)
    };

    document.addEventListener('pointerlockchange', (e) => {
        svs.pointerLocked = (document.pointerLockElement === canvas)
        svs.needsUpdate = true
    } , false)

    document.addEventListener('mousemove', (e) => {
        onMouseMove(svs, keyStates, e)
    }, false)

    /**
     * Make it so that SHIFT + KEYS do not register as the actual new chars.
     * @param {string} s
     */
    function handleCasing(s) {
        return s.replace("<", ",").replace(">", ".").toLowerCase()
    }

    document.addEventListener('keyup', (e) => {
        keyStates[handleCasing(e.key)] = false
    }, false)
    document.addEventListener('keydown', (e) =>{
        keyStates[handleCasing(e.key)] = true
    }, false)
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

    let raH  = Math.floor(ra)
    const raDecimal  = ra  - raH
    let { min: raM,  sec: raS  } = decimalToMinutesSeconds(raDecimal)

    if (raS  === 60) { raS  = 0; raM  += 1}
    if (raM  === 60) { raM  = 0; raH  += 1}

    const raString = `${raH.toString().padStart(2, "0")}h ${
                        raM.toString().padStart(2, "0")}m ${
                        raS.toString().padStart(2, "0")}s` 

    function getDecString(positiveDec) {
        let decD = Math.floor(positiveDec)
        const decDecimal = positiveDec - decD
        let { min: decM, sec: decS } = decimalToMinutesSeconds(decDecimal)
    
        if (decS === 60) { decS = 0; decM += 1}
        if (decM === 60) { decM = 0; decD += 1}

        return `${decD.toString().padStart(2, "0")}\u00b0 ${
                  decM.toString().padStart(2, "0")}' ${
                  decS.toString().padStart(2, "0")}"`
    }

    const decString = dec > 0 ? "+" + getDecString(dec) :
        (dec === 0 ?  "+" + getDecString(dec) : "-" + getDecString(-dec))

    return `RA ${raString} Dec ${decString}`
}

/**
 * @param {SkyViewState} svs
 */
function updateCanvas(svs) {
    if (svs.needsUpdate) {
        saveState(svs)
        clearCanvas(svs)
        svs.refreshRaDec()
        showPosition(svs)
        svs.drawAll()
        svs.needsUpdate = false
    }
}

/**
 * @param {SkyViewState} svs
 */
function saveState(svs) {
    localStorage.setItem("quaternion", svs.quaternion.toString())
    localStorage.setItem("zoom", svs.zoom)
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
