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

        
        if ((normalTransformed.z * normalTransformed.x > 0 && angle > Math.PI / 2) || (normalTransformed.z * normalTransformed.x < 0 && angle < Math.PI / 2)) {
            // startAngle += Math.PI
            // stopAngle  += Math.PI
        }

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
    constructor(endpoint, color = svs.colorScheme.lineColor) {
        super()
        this.endpoint = endpoint
        this.color = color
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

        const brightness = 10  * Math.pow(1.4, - this.magnitude)

        if (transformedPosition.collapseToXY().length + brightness > svs.size)
            return

        ctx.beginPath()
        ctx.ellipse(
            svs.centerX + transformedPosition.x, 
            svs.centerY + transformedPosition.y, 
            brightness, brightness, 0, 0, 2 * Math.PI    
        )
        ctx.fillStyle = svs.colors.starColor
        ctx.lineWidth = 1
        ctx.fill()

        ctx.fillStyle = svs.colors.textColor
        ctx.font = `${28 }px Arial`

        ctx.fillText(
            this.name, 
            svs.centerX + transformedPosition.x + 15, 
            svs.centerY + transformedPosition.y + 15
        );
        
    }
}
