/**
 * @param {number} i
 * @param {number} n
 * See: https://stackoverflow.com/questions/14997165/fastest-way-to-get-a-positive-modulo-in-c-c
 */
function positiveModulo(i, n) {
    return (i % n + n) % n
}

class Vector {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    constructor(x, y, z) {
        this.x = x
        this.y = y
        this.z = z
    }

    get length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2))
    }

    /**
     * Returns a new vector resulting from scaling this vector by 
     * a factor of `r`. Does not change the original vector.
     * 
     * @param {number} r
     */
    scale(r) {
        return new Vector(this.x * r, this.y * r, this.z * r)
    }

    toQuaternion() {
        return new Quaternion(this.x, this.y, this.z, 0)
    }

    /**
     * Transform this vector using the quaternion `q`.
     * 
     * @param {Quaternion} q
     */
    transformByQuaternion(q) {
        return q.inverse().multiply(this.toQuaternion()).multiply(q).vectorPart
    }
    
    collapseToXY() {
        return new Vector(this.x, this.y, 0)
    }

    /**
     * Calculates the dot product of this vector and `o`.
     * 
     * @param {Vector} o
     */
    dotProduct(o) {
        return this.x * o.x + this.y * o.y + this.z * o.z
    }

    /**
     * Calculates the cross product of this vector times `o`.
     * 
     * @param {Vector} o
     */
    crossProduct(o) {
        return new Vector(
            this.y * o.z - this.z * o.y,
            this.z * o.x - this.x * o.z,
            this.x * o.y - this.y * o.x,
        )
    }

    /**
     * Calculates the cosine distance between this vector and `o`.
     * 
     * @param {Vector} o
     */
    getCosineDistance(o) {
        const dotProduct = this.dotProduct(o)
        const lengthProduct = this.length * o.length
        return dotProduct / lengthProduct
    }
    
    /**
     * Gets the angle between this vector and `o`.
     * 
     * @param {Vector} o
     */
    getAngleTo(o) {
        return Math.acos(this.getCosineDistance(o))
    }

    toString() {
        return `(${this.x}, ${this.y}, ${this.z})`
    }
}

class Quaternion {

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} w
     */
    constructor(x, y, z, w) {
        this.x = x
        this.y = y
        this.z = z
        this.w = w
    }

    static identity() {
        return new Quaternion(0, 0, 0, 1)
    }

    /**
     * @param {string} s
     */
    static fromString(s) {
        if (!s) return undefined
        const a = s.split(",")
        return new Quaternion(a[0], a[1], a[2], a[3])
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} theta - angle in radians
     */
    static fromAxisAngle(x, y, z, theta) {
        return new Quaternion(
            x * Math.sin(theta / 2),
            y * Math.sin(theta / 2),
            z * Math.sin(theta / 2),
            Math.cos(theta / 2)
        )
    }

    /**
     * Returns the result of multiplying quaternions `a` times `b`.
     * Does not change either quaternion.
     * 
     * @param {Quaternion} a
     * @param {Quaternion} b
     */
    static multiply(a, b) {
        return new Quaternion(
            (a.x * b.w) + (a.w * b.x) + (a.y * b.z) - (a.z * b.y),
            (a.y * b.w) + (a.w * b.y) + (a.z * b.x) - (a.x * b.z),
            (a.z * b.w) + (a.w * b.z) + (a.x * b.y) - (a.y * b.x),
            (a.w * b.w) - (a.x * b.x) - (a.y * b.y) - (a.z * b.z)
        )
    }

    get magnitude() {
        return Math.sqrt(
            Math.pow(this.x, 2) +
            Math.pow(this.y, 2) +
            Math.pow(this.z, 2) +
            Math.pow(this.w, 2)
        )
    }

    /**
     * Returns the result of multiplying this quaternion times `o`.
     * Does not change either quaternion.
     * 
     * @param {Quaternion} o
     */
    multiply(o) {
        return Quaternion.multiply(this, o)
    }

    /**
     * Returns the result of multiplying `o` times this quaternion.
     * Does not change either quaternion.
     * 
     * @param {Quaternion} o
     */
    premultiply(o) {
        return Quaternion.multiply(o, this)
    }

    inverse() {
        return new Quaternion(
            - this.x,
            - this.y,
            - this.z,
              this.w
        )
    }

    toAxisAngle() {
        const angle = 2 * Math.acos(this.w)
        const axis = new Vector(this.x, this.y, this.z).scale(
            1 / Math.sin(angle / 2))
        return { axis, angle }
    }

    toString() {
        return `${this.x},${this.y},${this.z},${this.w}`
    }

    get vectorPart() {
        return new Vector(this.x, this.y, this.z)
    }
}

/**
 * @param {Object} raDec
 * @param {number} raDec.ra  - Right ascension in hours
 * @param {number} raDec.dec - Declination in degrees
 */
function raDecToPosition(raDec) {
    const { ra, dec } = raDec
    const raRad  = ra  / 12  * Math.PI - SV_VIEW_RA_ROTATION
    const decRad = dec / 180 * Math.PI
    const vector = new Vector( - Math.cos(raRad), 0, Math.sin(raRad)).scale(
        Math.cos(decRad))
    vector.y = - Math.sin(decRad)
    return vector
}

/**
 * @param {Vector} position - Unit vector pointing to the object in 
 *                            the celestial sphere
 */
function positionToRaDec(position) {
    // Apparently, due to rounding errors, there is a small chance
    // that the position vector is slightly longer than a unit vector...
    const len = position.length
    position = position.scale(1 / len)
    const raRad  = Math.atan2(position.z, - position.x) + SV_VIEW_RA_ROTATION
    const decRad = Math.asin(- position.y)
    const ra  = positiveModulo(raRad  * 12  / Math.PI, 24)
    const dec = decRad * 180 / Math.PI
    return { ra, dec }
}

/**
 * @param {List<number>} a
 * @param {List<number>} b
 */
function getRegionOverlap(a, b) {
    const start = Math.max(a[0], b[0])
    const stop  = Math.min(a[1], b[1])
    if (start >= stop) return undefined
    return [start, stop]
}
