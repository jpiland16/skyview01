class ColorScheme {
    /**
     * @param {string} bgColor
     * @param {string} textColor
     * @param {string} lineColor
     * @param {string} meridianColor
     * @param {string} parallelColor
     * @param {string} starColor
     */
    constructor(bgColor, textColor, lineColor, meridianColor, parallelColor, starColor) {
        this.bgColor = bgColor
        this.textColor = textColor
        this.meridianColor = meridianColor
        this.parallelColor = parallelColor
        this.starColor = starColor
    }
}

/**
 * @param {SkyViewState} svs  
 * @returns {Object<string, ColorScheme>} 
 */
function createColorSchemes(svs) {
    return {                    // BG       LINE     TEXT     MERID    PARLL    STAR
        "bright": new ColorScheme("white", "black", "black", "black", "black", "black"),
        "dark":   new ColorScheme("black", "white", "white", "white", "white", "white"),
        "red":    new ColorScheme("black", "red",   "red",   "red",   "red",   "red"),
    }
}