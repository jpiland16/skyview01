const HYG_DB_URL = "/data/hygfull.csv"
const CONST_BND_URL = "/data/constbnd.dat.txt"
const CONST_LINES_URL = "/data/constln.json"

const CONST_REGEX = /([ \d]\d\.\d{5}) ([\+-]\d{2}\.\d{5}) (\w+)(?: {1,2}(\w+))?/

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

class ConstellationBoundaryLine {
    /**
     * (A line of right ascension)
     * 
     * @param {number} decMin - minimum declination in degrees
     * @param {number} decMax - maximum declination in degrees
     * @param {number} ra     - right ascension in hours
     * @param {string} constellationName
     */
    constructor(decMin, decMax, ra) {
        this.decMin = decMin
        this.decMax = decMax
        this.ra = ra
    }

    /**
     * Determine whether the given parallel of declination is intersected by this line.
     * 
     * @param {number} dec - declination in hours
     */
    containsDec(dec) {
        return (this.decMin <= dec && dec < this.decMax)
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
        const point1 = points[i]
        const point2 = points[i+1]
        if (!point2.const2) continue // Starting a new constellation 
        if (point1.ra === point2.ra) {
            objects.push(new SkyGreatCircleSegment(
                point1.ra, point1.dec, point2.ra, point2.dec
            ))
            const decMin = Math.min(point1.dec, point2.dec)
            const decMax = Math.max(point1.dec, point2.dec)
            if (!svs.constBndLines[point1.const1]) {
                svs.constBndLines[point1.const1] = []
            }
            svs.constBndLines[point1.const1].push(new ConstellationBoundaryLine(
                decMin, decMax, point1.ra
            ))
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

/**
 * @param {SkyViewState} svs
 */
async function loadConstLines(svs) {
    const r = await (await fetch(CONST_LINES_URL)).json()
    /** @type {SkyObject[]} */ const objects = []
    for (const name in r) {
        lines = r[name]
        for (const points of lines) {
            for (let i = 0; i < points.length - 1; i++) {
                objects.push(new SkyGreatCircleSegment(
                    points[i][0],   points[i][1],
                    points[i+1][0], points[i+1][1],
                    false
                ))
            }
        }
    }
    svs.objects.push(...objects)
}
