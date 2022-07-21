const SV_GREAT_CIRCLE_SIZE = window.innerHeight * 1.2
const SV_GREAT_CIRCLE_BORDER = 1
const SV_MERIDIAN_COUNT = 6
const SV_PARALLEL_COUNT = 11
const SV_MOVEMENT_SCALE = 100
const SV_KEY_MOVEMENT_SCALE = 25
const SV_WHEEL_SCALE = 0.95
const SV_KEY_ZOOM_SCALE = 0.98
const SV_MIN_ZOOM = 0.5
const SV_MAX_ZOOM = Infinity
const SV_CROSSHAIR_SIZE = 35
const SV_CROSSHAIR_SPACE = 7
const SV_VIEW_RA_ROTATION = Math.PI / 2
const SV_CONTROL_SCALE = 20

const USE_OLD_BND = false // B1800 - uses lines of RA/dec
const APPROX_BND_USING_LINES = true // lines are faster than small elliptical 
                                    // segments
