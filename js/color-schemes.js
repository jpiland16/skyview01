class ColorScheme {
    constructor(bgColor, textColor, lineColor, meridianColor, parallelColor, starColor, htmlTextColor) {
        this.bgColor = bgColor
        this.textColor = textColor
        this.lineColor = lineColor
        this.meridianColor = meridianColor
        this.parallelColor = parallelColor
        this.starColor = starColor
        this.htmlTextColor = htmlTextColor
    }
}

/**
 * @param {SkyViewState} svs  
 * @returns {Object<string, ColorScheme>} 
 */
function createColorSchemes(svs) {

    const ctx = svs.ctx
    var redGrad = ctx.createRadialGradient(
        svs.centerX, svs.centerY, 0, 
        svs.centerX, svs.centerY, svs.size)
    redGrad.addColorStop("1.0", "#200000");
    redGrad.addColorStop("0.0", "#ff0000");
    

    return {                         // BG       TEXT     LINE     MERID    PARLL    STAR     HTML
        "bright":      new ColorScheme("white", "black", "black", "black", "black", "black", "black" ),
        "dark":        new ColorScheme("black", "white", "white", "white", "white", "white", "white" ),
        "red":         new ColorScheme("black", "red",   "red",   "red",   "red",   "red",   "red"   ),
        "red-grad":    new ColorScheme("black", redGrad, "red",   redGrad, redGrad, redGrad, "red"   ) 
    }
}