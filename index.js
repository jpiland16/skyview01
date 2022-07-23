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
        this.ui = UI.fromLocalStorage() || UI.default()
        
        /** @type {SkyObject[]} */ this.objects = []
        /** @type {Star[]} */      this.stars = []
        /** @type {Object<string, ConstellationBoundaryLine[]>} */ this.constBndLines = {}

        this.zoom = Number(localStorage.getItem("zoom")) || 1
        this.starFactor = Number(localStorage.getItem("starFactor")) || 1
        this.dpr = window.devicePixelRatio || 1
        this.colorSchemes = createColorSchemes(this)
        this.colorSchemeNames = Object.getOwnPropertyNames(this.colorSchemes)
        this.setColorScheme(localStorage.getItem("colorSchemeName") || "red-grad")
        this.currentConstellation = "constellation unknown"
        /** @type{Star} */ this.nearestStar = undefined

        this.constAbbreviations = {}
        this.greekAbbreviations = {}
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
        document.getElementById("extra").style.backgroundColor = 
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

    getFilteredStars() {
        return this.stars.filter((s) => 
            s.magnitude < this.zoom * 2 * this.starFactor &&
            this.raDecIsPossiblyInView(s.raDec)
        )
    }

    drawAll() {
        this.objects.forEach(o => o.draw(this))
        if (!this.ui.has("stars")) return
        this.getFilteredStars().forEach(s => s.draw(this))
    }

    getNearestStar() {
        const stars = this.getFilteredStars().filter((s) => s.name !== "")
        if (stars.length === 0) return undefined
        stars.sort((s1, s2) => getRaDecDistance(s1.raDec, this.raDec) 
            - getRaDecDistance(s2.raDec, this.raDec))
        return stars[0]
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

    /**
     * Returns the name of the constellation that the crosshairs are
     * currently positioned over.
     */
    getCurrentConstellation() {

        const { ra, dec } = precess2000to1875(this.raDec)
        // const { ra, dec } = this.raDec

        for (const constellationName in this.constBndLines) {

            const raValues = this.constBndLines[constellationName].filter((cbLine) => 
                cbLine.containsDec(dec)
            ).map((cbLine) => cbLine.ra).sort()
            if (raValues.length === 0) continue;

            const smallRaValues = raValues.filter((v) => v <= 12)
            const maxSmall = Math.min(...smallRaValues)
            const largeRaValues = raValues.filter((v) => v >  12)
            const minLarge = Math.min(...largeRaValues)

            const constellationStart = (minLarge - maxSmall < 12 || smallRaValues.length === 0 || largeRaValues.length === 0) ? 
                Math.min(...raValues) : minLarge
            const shiftedRaValues = raValues.map((v) =>
                positiveModulo(v - constellationStart, 24)
            )
            const shiftedStartPoint = positiveModulo(ra - constellationStart, 24)

            const crossingCount = shiftedRaValues.filter((v) => v < shiftedStartPoint).length
            if (crossingCount % 2 === 1) {
                // IMPORTANT NOTE: for RA 23h - 8h Dec +86.5deg - 88deg
                // AND for RA 3h30m - 7h40m Dec -82.5deg - -85deg
                // there are two sets of boundaries that meet these criteria,
                // namely (Cep/UMi) and (Men/Oct), respectively.
                // Fortunately, Cep and Men both come first in the list 
                // (because it is sorted alphabetically), 
                // otherwise the below line would not cover those two cases.
                return constellationName
            }
        }
        if (Object.getOwnPropertyNames(this.constBndLines).length === 0) return "loading constellations..."
        if (dec >=  86.5) return "UMi"
        if (dec <= -82.5) return "Oct"
        return "constellation unknown"
    }

}

class UI {
    /**
     * @param {Array<string> showing}
     */
    constructor(properties = []) {
        this.properties = properties
    }

    static fromLocalStorage() {
        const ui = localStorage.getItem("ui")
        try {
            return new UI(ui.split(" "))
        } catch {
            return undefined
        }
    }

    static default() {
        const ui = new UI([
            "crosshairs", "star-names", "star-sizes", "globe", "stars",
            "constellation-boundaries", "constellation-lines", 
            "highlight-const", "stat", "extra"
        ])
        ui.save()
        return ui
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
        this.save()
    }

    save() {
        localStorage.setItem("ui", this.properties.join(" "))
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
    loadConstBnd2(svs)
    loadConstLines(svs)
    loadConstAbbrev((abbrev) => {
        svs.constAbbreviations = abbrev.constellations
        svs.greekAbbreviations = abbrev.greekLetters
    })

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
    svs.currentConstellation = svs.getCurrentConstellation()
    let currentConstellation = svs.currentConstellation
    if (currentConstellation.length === 3) currentConstellation += "\u00a0"
    stat(raDecToString(svs.raDec, svs.ui.has("decimal-display")) + " | " + 
        currentConstellation)

    if (!svs.ui.has("extra")) return // don't do additional calculations
        
    const extra1 = document.getElementById("extra1")
    const extra2 = document.getElementById("extra2")

    // Show constellation info

    const fullConstNames = (
        svs.constAbbreviations[svs.currentConstellation] || ["", ""])
    const fullConstName = fullConstNames[0]

    extra1.innerText = 
        `Constellation: ${currentConstellation}| ${fullConstName}`
    extra1.onclick = (e) => {
        window.open("https://www.google.com/search?q=" + 
        encodeURI(`${fullConstName.toLowerCase()} constellation`))
        e.stopPropagation()
    }

    // Show star info

    const nearestStar = svs.getNearestStar() || { name: "" }
    svs.nearestStar = nearestStar

    const possibleConstName = nearestStar.name.slice(-3)
    const hasConstName = Object.getOwnPropertyNames(svs.constAbbreviations)
        .indexOf(possibleConstName) > -1

    let starName = hasConstName ? 
        nearestStar.name.slice(0, -3) : nearestStar.name
    const constNameGenitive = hasConstName ? 
        svs.constAbbreviations[possibleConstName][1] : ""

    let firstLetterIndex = 0;
    while (starName[firstLetterIndex] && !/[A-Z]/.test(starName[firstLetterIndex])) firstLetterIndex += 1
    const greekName = starName.slice(firstLetterIndex, firstLetterIndex + 3)

    if (Object.getOwnPropertyNames(svs.greekAbbreviations)
            .indexOf(greekName) > -1)
        starName = starName.slice(0, firstLetterIndex)
            + svs.greekAbbreviations[greekName][1]
            + starName.slice(firstLetterIndex + 3)

    const fullStarName = starName + constNameGenitive
    
    extra2.innerText = `Nearest star: \u00a0${fullStarName}`

    extra2.onclick =  (e) => {
        window.open("https://www.google.com/search?q=" + 
        encodeURI(`${fullStarName.toLowerCase()} star`))
        e.stopPropagation()
    }
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
 * @param {number} raDec.ra  - right ascension in hours
 * @param {number} raDec.dec - declination in degrees
 * @param {boolean} decimal  - whether to output as [deg|hr]/min/sec or 
 *                             as a decimal value
 */
function raDecToString(raDec, decimal = false) {

    const { ra, dec } = raDec

    if (decimal) {
        const decimalPlaces = 6
        const raRounded = ra.toFixed(decimalPlaces)
        const decRounded = dec.toFixed(decimalPlaces)
        const raString = raRounded.padStart(decimalPlaces + 3, "0") + "h"
        const decString = (dec < 0 ? "" : "+") 
            + decRounded.padStart(decimalPlaces + 3, "0") + "\u00b0"
        return `RA ${raString} Dec ${decString}`
    }

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
function hideShowOverlays(svs) {
    document.getElementById("stat").style.display = (svs.ui.has("stat")) ? 
        "block" : "none"
    document.getElementById("extra").style.display = (svs.ui.has("extra")) ? 
        "block" : "none"
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
        hideShowOverlays(svs)
        svs.needsUpdate = false
    }
}

/**
 * @param {SkyViewState} svs
 */
function saveState(svs) {
    localStorage.setItem("quaternion", svs.quaternion.toString())
    localStorage.setItem("zoom", svs.zoom)
    localStorage.setItem("starFactor", svs.starFactor)
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
