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

    const red = "#ff0000"
    const redGrad = ctx.createRadialGradient(
        svs.centerX, svs.centerY, 0, 
        svs.centerX, svs.centerY, svs.size)
    redGrad.addColorStop("0.99", "#00000000");
    redGrad.addColorStop("0.98", "#200000");
    redGrad.addColorStop("0.00", "#ff0000");

    const green = "#00ff00"
    const grnGrad = ctx.createRadialGradient(
        svs.centerX, svs.centerY, 0, 
        svs.centerX, svs.centerY, svs.size)
    grnGrad.addColorStop("0.99", "#00000000");
    grnGrad.addColorStop("0.98", "#002000");
    grnGrad.addColorStop("0.00", "#00ff00");

    const blue = "#2080ff"
    const bluGrad = ctx.createRadialGradient(
        svs.centerX, svs.centerY, 0, 
        svs.centerX, svs.centerY, svs.size)
    bluGrad.addColorStop("0.99", "#00000000");
    bluGrad.addColorStop("0.98", "#021020");
    bluGrad.addColorStop("0.00", blue);
    
    const black = "#000000"
    const blkGrad = ctx.createRadialGradient(
        svs.centerX, svs.centerY, 0, 
        svs.centerX, svs.centerY, svs.size)
    blkGrad.addColorStop("0.99", "#00000000");
    blkGrad.addColorStop("0.98", "#d0d0d0");
    blkGrad.addColorStop("0.00", "#000000");

    const white = "#ffffff"
    const whtGrad = ctx.createRadialGradient(
        svs.centerX, svs.centerY, 0, 
        svs.centerX, svs.centerY, svs.size)
    whtGrad.addColorStop("0.99", "#00000000");
    whtGrad.addColorStop("0.98", "#202020");
    whtGrad.addColorStop("0.00", "#ffffff");

    return {                         // BG       TEXT     LINE     MERID    PARLL    STAR     HTML
        "red-grad":    new ColorScheme("black", redGrad, "red",   redGrad, redGrad, redGrad, red   ), 
        "grn-grad":    new ColorScheme("black", grnGrad, "green", grnGrad, grnGrad, grnGrad, green ), 
        "blu-grad":    new ColorScheme("black", bluGrad,  blue,   bluGrad, bluGrad, bluGrad, blue  ),
        "blk-grad":    new ColorScheme("black", whtGrad, "white", whtGrad, whtGrad, whtGrad, white ),
        "wht-grad":    new ColorScheme("white", blkGrad, "black", blkGrad, blkGrad, blkGrad, black ), 
        "red":         new ColorScheme("black", "red",   "red",   "red",   "red",   "red",   red   ),
        "green":       new ColorScheme("black", "green", "green", "green", "green", "green", green ),
        "blue":        new ColorScheme("black", blue,    blue,    blue,    blue,    blue,    blue  ),
        "dark":        new ColorScheme("black", "white", "white", "white", "white", "white", white ),
        "bright":      new ColorScheme("white", "black", "black", "black", "black", "black", black )
    }
}