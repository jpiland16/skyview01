/**
 * @param {SkyViewState} svs
 */
 function createMeridians(svs) {

    radSep = Math.PI / SV_MERIDIAN_COUNT

    for (let i = 0; i < SV_MERIDIAN_COUNT; i++) {
        const angle = radSep * i
        const normal = new Vector(Math.cos(angle), 0, Math.sin(angle))
        svs.addObject(new SkyMeridian(normal))
    }
}

/**
 * @param {SkyViewState} svs
 */
 function createParallels(svs) {

    radSep = Math.PI / (SV_PARALLEL_COUNT + 1)

    for (let i = 1; i <= SV_PARALLEL_COUNT; i++) {
        const angle = radSep * i - Math.PI / 2
        svs.addObject(new SkyParallel(angle))
    }
}
