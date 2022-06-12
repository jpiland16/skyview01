class SkyObject {
    /**
     * Draws the object using the given context and SkyView state.
     * 
     * @param {SkyViewState} svs
     */
    draw(svs) {
        const ctx = svs.ctx
        // Code to draw object goes here (override)
    }
}

class CrossHairs extends SkyObject {
    /**
     * @override
     * 
     * @param {SkyViewState} svs 
     */
    draw(svs) {

        if (!svs.ui.has("crosshairs")) return

        const ctx = svs.ctx
        const xCenter = svs.centerX
        const yCenter = svs.centerY
        ctx.beginPath()
        // UP
        ctx.moveTo(xCenter, yCenter - SV_CROSSHAIR_SPACE)
        ctx.lineTo(xCenter, yCenter - SV_CROSSHAIR_SIZE)
        // DOWN
        ctx.moveTo(xCenter, yCenter + SV_CROSSHAIR_SPACE)
        ctx.lineTo(xCenter, yCenter + SV_CROSSHAIR_SIZE)
        // LEFT
        ctx.moveTo(xCenter - SV_CROSSHAIR_SPACE, yCenter)
        ctx.lineTo(xCenter - SV_CROSSHAIR_SIZE, yCenter)
        // RIGHT
        ctx.moveTo(xCenter + SV_CROSSHAIR_SPACE, yCenter)
        ctx.lineTo(xCenter + SV_CROSSHAIR_SIZE, yCenter)
        ctx.strokeStyle = svs.pointerLocked ? "red" : "gray"
        ctx.lineWidth = 0.5
        ctx.stroke()
    }
}

class EarthCircle extends SkyObject {
    /**
     * @override
     * 
     * @param {SkyViewState} svs 
     */
    draw(svs) {
        const ctx = svs.ctx
        ctx.beginPath()
        ctx.ellipse(
            svs.centerX, 
            svs.centerY, 
            svs.sizeBorderless + 1, 
            svs.sizeBorderless + 1, 
            0, 0, 2 * Math.PI
        );
        ctx.strokeStyle = svs.colors.lineColor
        ctx.lineWidth = 2
        ctx.stroke()
    }
}

class SkyMeridian extends SkyObject {
    /**
     * @param {Vector} normal
     */
    constructor(normal) {
        super()
        this.normal = normal
    }

    /**
     * @override
     * 
     * @param {SkyViewState} svs
     */
    draw(svs) {

        if (!svs.ui.has("globe")) return

        const ctx = svs.ctx

        const normalTransformed = this.normal.transformByQuaternion(
            svs.quaternion).scale(svs.sizeBorderless)

        const majorAxisLength = 1 * (svs.sizeBorderless)
        const minorAxisLength = Math.abs(normalTransformed.getCosineDistance(
            new Vector(0, 0, 1))) * (svs.sizeBorderless)
        
        const normalCollapsed = normalTransformed.collapseToXY()

        const negator = (normalCollapsed.y > 0) ? -1 : 1

        const angle = positiveModulo(
            normalCollapsed.length === 0 ? 0 :
                normalCollapsed.getAngleTo(new Vector(-1, 0, 0)) * negator,
            Math.PI
        )
        
        let startAngle = - Math.PI / 2
        let stopAngle = Math.PI / 2
        if ((normalTransformed.z * normalTransformed.x > 0 && angle >= Math.PI / 2) || (normalTransformed.z * normalTransformed.x < 0 && angle < Math.PI / 2)) {
            startAngle += Math.PI
            stopAngle  += Math.PI
        }

        ctx.beginPath()
        ctx.ellipse(
            svs.centerX, 
            svs.centerY, 
            minorAxisLength, 
            majorAxisLength, 
            angle,
            startAngle, stopAngle
            // 0, 2 * Math.PI
        );
        ctx.strokeStyle = svs.colors.meridianColor
        ctx.lineWidth = 1
        ctx.stroke()
    }
}

class SkyParallel extends SkyObject {
    /**
     * @param {number} latitude - latitude above the equator, in radians
     */
    constructor(latitude) {
        super()
        this.latitude = latitude
        this.positionVector = new Vector(0, - Math.sin(latitude), 0)
    }

    /**
     * @override
     * 
     * @param {SkyViewState} svs
     */
    draw(svs) {

        if (!svs.ui.has("globe")) return

        const ctx = svs.ctx

        const normalTransformed = new Vector(0, -1, 0).transformByQuaternion(
            svs.quaternion)

        const majorAxisLength = Math.cos(this.latitude) * (
            svs.sizeBorderless)
        const minorAxisLength = Math.abs(normalTransformed.getCosineDistance(
            new Vector(0, 0, 1))) * Math.cos(this.latitude) * (
                svs.sizeBorderless)
        
        const normalCollapsed = normalTransformed.collapseToXY()

        const positionTransformed = this.positionVector.transformByQuaternion(
            svs.quaternion).scale(svs.size)

        const negator = (normalCollapsed.y > 0) ? -1 : 1

        const angle = positiveModulo(
            normalCollapsed.length === 0 ? 0 :
                normalCollapsed.getAngleTo(new Vector(-1, 0, 0)) * negator,
            Math.PI
        )

        const axisTilt = Math.PI / 2 - new Vector(0, -1, 0).transformByQuaternion(
            svs.quaternion
        ).getAngleTo(new Vector(0, 0, 1))
                    
        let versin = Math.cos(this.latitude + axisTilt) / Math.cos(axisTilt)
        let angleSubtended;

        if (versin < 0) angleSubtended = 0;
        else if (versin > 2 * Math.cos(this.latitude)) angleSubtended = Math.PI;
        else angleSubtended = Math.acos(1 - (versin / Math.cos(this.latitude)))

        let startAngle = - angleSubtended
        let stopAngle = angleSubtended

        if (normalTransformed.z * normalTransformed.y < 0) {
            startAngle += Math.PI
            stopAngle  += Math.PI
        }

        ctx.beginPath()
        ctx.ellipse(
            svs.centerX + positionTransformed.x, 
            svs.centerY + positionTransformed.y, 
            minorAxisLength, 
            majorAxisLength, 
            angle, startAngle, stopAngle
        );
        ctx.strokeStyle = svs.colors.parallelColor
        ctx.lineWidth = 1
        ctx.stroke()
    }
}

class SkyRadius extends SkyObject {
    /**
     * @param {Vector} endpoint
     * @param {string} color
     */
    constructor(endpoint, color = "black") {
        super()
        this.endpoint = endpoint
        this.color = color
    }

    /**
     * @param {number} ra - right ascension in hours
     * @param {number} dec - declination in degrees
     * @param {string} color
     */
    static fromRaDec(ra, dec, color) {
        return new SkyRadius(new Vector(
              Math.cos(dec / 180 * Math.PI) * Math.cos((ra + 6) / 12 * Math.PI), 
            - Math.sin(dec / 180 * Math.PI),
            - Math.cos(dec / 180 * Math.PI) * Math.sin((ra + 6) / 12 * Math.PI)
        ), color)
    }

    /**
     * @override
     * 
     * @param {SkyViewState} svs
     */
     draw(svs) {
        const ctx = svs.ctx
        const endpointTransformed = this.endpoint.transformByQuaternion(
            svs.quaternion).scale(svs.sizeBorderless)
        ctx.beginPath()
        ctx.moveTo(svs.centerX, svs.centerY)
        ctx.lineTo(
            endpointTransformed.x + svs.centerX, 
            endpointTransformed.y + svs.centerY
        )
        if (endpointTransformed.z > 0) ctx.lineWidth = 3; else ctx.lineWidth = 1
        ctx.strokeStyle = this.color
        ctx.stroke()
     }
}

class SkyGreatCircleSegment extends SkyObject {
    /**
     * @param {number} ra1  - right ascension 1 in hours
     * @param {number} dec1 - declination 1 in degrees
     * @param {number} ra2  - right ascension 2 in hours
     * @param {number} dec2 - declination 2 in degrees
     */
    constructor(ra1, dec1, ra2, dec2) {
        super()
        this.position1 = raDecToPosition({ ra: ra1, dec: dec1 })
        this.position2 = raDecToPosition({ ra: ra2, dec: dec2 })
        const normalTemp = this.position1.crossProduct(this.position2)
        this.normal = normalTemp.scale(1 / normalTemp.length)
        this.maxAngleSubtended = this.position1.getAngleTo(this.position2)
    }

    /**
     * @override
     * 
     * @param {SkyViewState} svs
     */
    draw(svs) {

        if (!svs.ui.has("constellation-boundaries")) return

        const ctx = svs.ctx

        const pos1transformed = this.position1.transformByQuaternion(
            svs.quaternion)
        const pos2transformed = this.position2.transformByQuaternion(
            svs.quaternion)

        let startOff, stopOff, flipped;

        // if (pos1transformed.z > 0 && pos2transformed.z > 0) return

        const normalTransformed = this.normal.transformByQuaternion(
            svs.quaternion).scale(svs.sizeBorderless)

        const cosineDistance = normalTransformed.getCosineDistance(
            new Vector(0, 0, 1))

        const majorAxisLength = 1 * (svs.sizeBorderless)
        const minorAxisLength = Math.abs(cosineDistance) * (svs.sizeBorderless)
        
        const normalCollapsed = normalTransformed.collapseToXY()

        const negator = (normalCollapsed.y > 0) ? -1 : 1

        const theta = positiveModulo(
            normalCollapsed.length === 0 ? 0 :
                normalCollapsed.getAngleTo(new Vector(-1, 0, 0)) * negator,
            Math.PI
        )

        const phi = Math.acos(cosineDistance)
        const circleMidpointVec = new Vector(
            - Math.cos(phi) * Math.cos(theta),
            - Math.cos(phi) * Math.sin(theta), 
            - Math.sin(phi)
        )

        if (negator === -1) {
            circleMidpointVec.x = - circleMidpointVec.x
            circleMidpointVec.y = - circleMidpointVec.y
        }

        window.negator = negator

        //

        /**
         * @param {Vector} vec 
         * @param {Vector} vecXY 
         * @param {number} offsetAngle
         */
        function getPositionOnEllipse(vec) {
            if (vec.z > 0) return Math.PI / 2
            return Math.PI - vec.getAngleTo(circleMidpointVec)
        }

        let startAngle = getPositionOnEllipse(pos1transformed)
        let stopAngle  = getPositionOnEllipse(pos2transformed)

        if (negator === -1) {
            startAngle += Math.PI
            stopAngle  += Math.PI
        }

        window.startAngle = startAngle * 180 / Math.PI
        window.stopAngle = stopAngle * 180 / Math.PI
        window.circleStartVec = circleMidpointVec
        window.startAngle2 = circleMidpointVec.getAngleTo(pos1transformed) * 180 / Math.PI


        ctx.beginPath()
        ctx.ellipse(
            svs.centerX, 
            svs.centerY, 
            minorAxisLength, 
            majorAxisLength, 
            theta,
            startAngle, stopAngle
        );
        ctx.strokeStyle = svs.colors.meridianColor
        ctx.lineWidth = 10
        ctx.stroke()

        //

        ctx.beginPath()
        ctx.ellipse(
            svs.centerX, 
            svs.centerY, 
            minorAxisLength, 
            majorAxisLength, 
            theta,
            0, 2 * Math.PI
        );
        ctx.strokeStyle = svs.colors.meridianColor
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(svs.centerX, svs.centerY)
        ctx.lineTo(
            circleMidpointVec.x * svs.size + svs.centerX, 
            circleMidpointVec.y * svs.size + svs.centerY
        )
        if (circleMidpointVec.z > 0) ctx.lineWidth = 3; else ctx.lineWidth = 1
        ctx.strokeStyle = "green"
        ctx.stroke()

    }
}

class SkyParallelLineSegment extends SkyObject {
    /**
     * @param {number} dec   - declination in degrees
     * @param {number} raMin - minimum right ascension, in hours
     * @param {number} raMax - maximum right ascension, in hours
     */
    constructor(dec, raMin, raMax) {
        super()
        this.latitude = dec * Math.PI / 180
        this.raRadMin = positiveModulo(
            raMin / 12 * Math.PI - SV_VIEW_RA_ROTATION, 2 * Math.PI)
        this.raRadMax = positiveModulo(
            raMax / 12 * Math.PI - SV_VIEW_RA_ROTATION, 2 * Math.PI)
        this.positionVector = new Vector(0, - Math.sin(this.latitude), 0)
    }

    /**
     * @override
     * 
     * @param {SkyViewState} svs
     */
    draw(svs) {

        if (!svs.ui.has("constellation-boundaries")) return

        const ctx = svs.ctx

        const normalTransformed = new Vector(0, -1, 0).transformByQuaternion(
            svs.quaternion)

        const majorAxisLength = Math.cos(this.latitude) * (
            svs.sizeBorderless)
        const minorAxisLength = Math.abs(normalTransformed.getCosineDistance(
            new Vector(0, 0, 1))) * Math.cos(this.latitude) * (
                svs.sizeBorderless)
        
        const normalCollapsed = normalTransformed.collapseToXY()

        const positionTransformed = this.positionVector.transformByQuaternion(
            svs.quaternion).scale(svs.size)

        const negator = (normalCollapsed.y > 0) ? -1 : 1

        const angle = positiveModulo(
            normalCollapsed.length === 0 ? 0 :
                normalCollapsed.getAngleTo(new Vector(-1, 0, 0)) * negator,
            Math.PI
        )

        const axisTilt = Math.PI / 2 - new Vector(0, -1, 0).transformByQuaternion(
            svs.quaternion
        ).getAngleTo(new Vector(0, 0, 1))
                    
        let versin = Math.cos(this.latitude + axisTilt) / Math.cos(axisTilt)
        let angleSubtended;

        if (versin < 0) angleSubtended = 0;
        else if (versin > 2 * Math.cos(this.latitude)) angleSubtended = Math.PI;
        else angleSubtended = Math.acos(1 - (versin / Math.cos(this.latitude)))

        let startAngle = - angleSubtended
        let stopAngle = angleSubtended
        
        let flipped = false;

        if (normalTransformed.z * normalTransformed.y < 0) {
            startAngle += Math.PI
            stopAngle  += Math.PI
            flipped = true
        }
        
        const raRadVisibleMin = positiveModulo(
            svs.raDec.ra / 12 * Math.PI - SV_VIEW_RA_ROTATION - angleSubtended, 
            2 * Math.PI
        )
        const raRadVisibleMax = positiveModulo(
            svs.raDec.ra / 12 * Math.PI - SV_VIEW_RA_ROTATION + angleSubtended, 
            2 * Math.PI
        )

        // Deal with the discontinuity about RA = 24h (2 * PI)

        let visibleRegion1, visibleRegion2, lineSegment1, lineSegment2;

        if (raRadVisibleMin > raRadVisibleMax) {
            visibleRegion1 = [0, raRadVisibleMax]
            visibleRegion2 = [raRadVisibleMin, 2 * Math.PI]
        } else if (angleSubtended === Math.PI) {
            visibleRegion1 = [0, 2 * Math.PI]
        } else {
            visibleRegion1 = [raRadVisibleMin, raRadVisibleMax]
        }

        if (this.raRadMin > this.raRadMax) {
            lineSegment1 = [0, this.raRadMax]
            lineSegment2 = [this.raRadMin, 2 * Math.PI]
        } else {
            lineSegment1 = [this.raRadMin, this.raRadMax]
        }

        for (const seg of [lineSegment1, lineSegment2]) {

            if (!seg) continue

            for (const reg of [visibleRegion1, visibleRegion2]) {

                if (!reg) continue

                const visibleSegment = getRegionOverlap(seg, reg)
                if (!visibleSegment) continue

                const startOff = (!flipped) ?
                    visibleSegment[0] - raRadVisibleMin :
                    raRadVisibleMax - visibleSegment[1]
                    
                const stopOff  = (!flipped) ?
                    visibleSegment[1] - raRadVisibleMin :
                    raRadVisibleMax - visibleSegment[0]
                
                ctx.beginPath()
                ctx.ellipse(
                    svs.centerX + positionTransformed.x, 
                    svs.centerY + positionTransformed.y, 
                    minorAxisLength, 
                    majorAxisLength, 
                    angle, 
                    (normalTransformed.y < 0) ? startAngle + startOff : stopAngle - stopOff, 
                    (normalTransformed.y < 0) ? startAngle + stopOff  : stopAngle - startOff,
                );
                ctx.strokeStyle = svs.colors.parallelColor
                ctx.lineWidth = 1
                ctx.setLineDash([2, 4])
                ctx.stroke()
                ctx.setLineDash([0, 0])
            }
            
        }
    }
}

class Star extends SkyObject {
    /**
     * @param {number} ra
     * @param {number} dec
     * @param {number} magnitude
     * @param {string} name
     */
    constructor(ra, dec, magnitude, name) {
        super()
        this.raDec = {
            ra:  ra,
            dec: dec
        }
        this.magnitude = magnitude
        this.name = name
        this.position = raDecToPosition(this.raDec)
    }

    /**
     * @override
     * 
     * @param {SkyViewState} svs
     */
    draw(svs) {
        const ctx = svs.ctx
    
        const transformedPosition = this.position.transformByQuaternion(
            svs.quaternion).scale(svs.size)

        if (transformedPosition.z > 0) return

        let brightness = 10  * Math.pow(1.4, - this.magnitude)

        if (transformedPosition.collapseToXY().length + brightness > svs.size)
            return
        
        const starOpacity = Math.round(Math.min(brightness / 6.2 * 255, 255))
        const starOpacityText = starOpacity.toString(16).padStart(2, "0") 

        if (!svs.ui.has("star-sizes"))
            brightness = 3

        ctx.beginPath()
        ctx.ellipse(
            svs.centerX + transformedPosition.x, 
            svs.centerY + transformedPosition.y, 
            brightness, brightness, 0, 0, 2 * Math.PI    
        )
        ctx.fillStyle = svs.ui.has("star-opacity") ? 
            svs.colors.htmlTextColor + starOpacityText : svs.colors.textColor
        ctx.lineWidth = 1
        ctx.fill()

        if (!svs.ui.has("star-names")) return

        ctx.fillStyle = svs.colors.starColor
        ctx.font = `${28 }px Arial`

        ctx.fillText(
            this.name, 
            svs.centerX + transformedPosition.x + 15, 
            svs.centerY + transformedPosition.y + 15
        );
        
    }
}
