const HYG_DB_URL = "https://raw.githubusercontent.com/astronexus/HYG-Database/master/hygfull.csv"

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
 * @param {SkyViewState} svs
 */
async function loadHYG(svs) {
    const r = await (await fetch(HYG_DB_URL)).text()
    r.split("\n").slice(1).map(processStarRecord).forEach(s => svs.addStar(s))
    svs.needsUpdate = true
}
