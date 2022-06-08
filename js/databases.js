const HYG_DB_URL = "/data/hygfull.csv"
const CONST_BND_URL = "/data/constbnd.dat.txt"

const CONST_REGEX = /([ \d]\d\.\d{5}) ([\+-]\d{2}\.\d{5}) (\w+)(?: {2}(\w+))?/

class ConstellationBoundaryPoint {
    /**
     * @param {number} ra
     * @param {number} dec
     * @param {string} const1
     * @param {string} const2
     */
    constructor(ra, dec, const1, const2) {
        this.ra     = ra
        this.dec    = dec
        this.const1 = const1
        this.const2 = const2
    }
}

/**
 * @param {string} record
 */
function processStarRecord(record) {

    const s = record.split(",")
    const ra = s[7]
    const dec =  s[8]
    const properName = s[6]
    const bfName = s[5]
    const mag = s[10]

    const name = properName === "" ? bfName : properName
    return new Star(ra, dec, mag, name)

}

/**
 * @param {string} record
 */
function processConstBndPtRecord(record) {
    const matches = CONST_REGEX.exec(record).slice(1)
    return new ConstellationBoundaryPoint(...matches)
}

/**
 * @param {SkyViewState} svs
 */
async function loadConstBnd(svs) {
    const r = await (await fetch(CONST_BND_URL)).text()
    const points = r.split("\n").slice(0, -1).map(processConstBndPtRecord)
    /** @type {SkyObject[]} */ const objects = []
    for (let i = 0; i < points.length - 1; i++) {
    // for (let i = 0; i < 38; i++) {
        const point1 = points[i]
        const point2 = points[i+1]
        if (!point2.const2) continue // Starting a new constellation 
        if (point1.ra === point2.ra) {
            // objects.push("part of a great circle")
        } else {
            let raStart = point1.ra
            let raStop  = point2.ra
            // Note that our plotting engine expects everything to work 
            // counterclockwise, so we have to flip the start and stop points
            // if we are moving clockwise. Warning - there may be issues later
            // if we need to draw parallels that span more than 12 hours!
            if (positiveModulo(raStop - raStart, 24) > 12) { 
                raStart = point2.ra
                raStop = point1.ra
            }
            objects.push(new SkyParallelLineSegment(
                point1.dec,
                raStart, raStop
            ))
        }
    }
    svs.objects.push(...objects)
    svs.needsUpdate = true
}

/**
 * @param {SkyViewState} svs
 */
async function loadHYG(svs) {
    const r = await (await fetch(HYG_DB_URL)).text()
    r.split("\n").slice(1).map(processStarRecord).forEach(s => svs.addStar(s))
    svs.needsUpdate = true
}
