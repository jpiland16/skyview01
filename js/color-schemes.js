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
    const redGrad = ctx.createRadialGradient(
        svs.centerX, svs.centerY, 0, 
        svs.centerX, svs.centerY, svs.size)
    redGrad.addColorStop("1.0", "#200000");
    redGrad.addColorStop("0.0", "#ff0000");

    const grnGrad = ctx.createRadialGradient(
        svs.centerX, svs.centerY, 0, 
        svs.centerX, svs.centerY, svs.size)
    grnGrad.addColorStop("1.0", "#002000");
    grnGrad.addColorStop("0.0", "#00ff00");

    const blue = "#2080ff"
    const bluGrad = ctx.createRadialGradient(
        svs.centerX, svs.centerY, 0, 
        svs.centerX, svs.centerY, svs.size)
    bluGrad.addColorStop("1.0", "#021020");
    bluGrad.addColorStop("0.0", blue);

    return {                         // BG       TEXT     LINE     MERID    PARLL    STAR     HTML
        "bright":      new ColorScheme("white", "black", "black", "black", "black", "black", "black" ),
        "dark":        new ColorScheme("black", "white", "white", "white", "white", "white", "white" ),
        "red":         new ColorScheme("black", "red",   "red",   "red",   "red",   "red",   "red"   ),
        "red-grad":    new ColorScheme("black", redGrad, "red",   redGrad, redGrad, redGrad, "red"   ), 
        "grn-grad":    new ColorScheme("black", grnGrad, "green", grnGrad, grnGrad, grnGrad, "green" ), 
        "blu-grad":    new ColorScheme("black", bluGrad, blue,    bluGrad, bluGrad, bluGrad, blue    )
    }
}