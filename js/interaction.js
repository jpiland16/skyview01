/**
 * @param {KeyboardEvent} e
 * @param {SkyViewState} svs
 */
 function handleKeyPress(e, svs) {
    if (svs.pointerLocked) {
        switch (e.key) {
            case "0":
                svs.quaternion = Quaternion.identity()
                svs.needsUpdate = true
                break
            case "c":
                svs.chooseNextColorScheme()
                break
            case "C":
                svs.choosePrevColorScheme()
                break
            case ")":
                svs.quaternion = Quaternion.identity()
                svs.zoom = 1
                svs.starFactor = 1.6
                svs.setColorScheme("black-grad")
                svs.updateGradients()
                svs.ui = UI.default()
                svs.needsUpdate = true
                break
            case "n":
                svs.ui.toggle("star-names")
                svs.needsUpdate = true
                break
            case "h":
                svs.ui.toggle("crosshairs")
                svs.needsUpdate = true
                break
            case "b":
                svs.ui.toggle("star-sizes")
                svs.needsUpdate = true
                break
            case "B":
                svs.ui.toggle("constellation-boundaries")
                svs.needsUpdate = true
                break
            case "v":
                svs.ui.toggle("star-opacity")
                svs.needsUpdate = true
                break
            case "V":
                svs.ui.toggle("stars")
                svs.needsUpdate = true
                break
            case "g":
                svs.ui.toggle("globe")
                svs.needsUpdate = true
                break
            case "q":
                svs.ui.toggle("reversed-control")
                break
            case "r":
                svs.ui.toggle("decimal-display")
                svs.needsUpdate = true
                break
            case "m":
                svs.ui.toggle("movie")
                break
            case "L":
                svs.ui.toggle("constellation-lines")
                svs.needsUpdate = true
                break
            case "l":
                const transformedY = new Vector(0, -1, 0)
                    .transformByQuaternion(svs.quaternion).collapseToXY()
                let zRotation = transformedY.getAngleTo(new Vector(0, -1, 0))
                if (transformedY.x < 0) zRotation = 2 * Math.PI - zRotation
                svs.quaternion = svs.quaternion.multiply(
                    Quaternion.fromAxisAngle(0, 0, 1, zRotation))
                svs.needsUpdate = true
                break
            case "i":
                svs.ui.toggle("highlight-const")
                svs.needsUpdate = true
                break
            case "w":
                svs.ui.toggle("stat")
                svs.needsUpdate = true
                break
            case "e":
                svs.ui.toggle("extra")
                svs.needsUpdate = true
                break
        }
    }
}

/**
 * @param {Object<string, boolean>} keyStates
 * @param {SkyViewState} svs
 */
function handlePressedKeys(keyStates, svs) {
    if (svs.pointerLocked) {
        let scale = 1 / SV_KEY_MOVEMENT_SCALE / svs.zoom
        if (keyStates["shift"]) scale /= SV_CONTROL_SCALE
        if (keyStates[","] && !keyStates["."]) {
            const zRotationQuaternion = Quaternion.fromAxisAngle(
                0, 0, 1, scale * svs.zoom) // Still rotate at a normal speed
            svs.quaternion = svs.quaternion.multiply(zRotationQuaternion)
            svs.needsUpdate = true
        }  
        if (keyStates["."] && !keyStates[","]) {
            const zRotationQuaternion = Quaternion.fromAxisAngle(
                0, 0, 1, - scale * svs.zoom) // Still rotate at a normal speed
            svs.quaternion = svs.quaternion.multiply(zRotationQuaternion)
            svs.needsUpdate = true
        }
        if (keyStates["o"] && !keyStates["p"]) {
            rotatePositiveRa(svs, scale)
        }  
        if (keyStates["p"] && !keyStates["o"]) {
            rotateNegativeRa(svs, scale)
        }
        if (svs.ui.has("movie")) {
            rotateNegativeRa(svs, 1 / SV_KEY_MOVEMENT_SCALE / svs.zoom / SV_CONTROL_SCALE)
        }
        if (keyStates["d"] && !keyStates["f"]) {
            rotatePositiveDec(svs, scale)
        }  
        if (keyStates["f"] && !keyStates["d"]) {
            rotateNegativeDec(svs, scale)
        }
        if (keyStates["arrowup"] && !keyStates["arrowdown"]) {
            const xRotationQuaternion = Quaternion.fromAxisAngle(
                1, 0, 0, - scale)
            svs.quaternion = svs.quaternion.multiply(xRotationQuaternion)
            svs.needsUpdate = true
        } 
        if (keyStates["arrowdown"] && !keyStates["arrowup"]) {
            const xRotationQuaternion = Quaternion.fromAxisAngle(
                1, 0, 0, scale)
            svs.quaternion = svs.quaternion.multiply(xRotationQuaternion)
            svs.needsUpdate = true
        }
        if (keyStates["arrowleft"] && !keyStates["arrowright"]) {
            const yRotationQuaternion = Quaternion.fromAxisAngle(
                0, 1, 0, scale)
            svs.quaternion = svs.quaternion.multiply(yRotationQuaternion)
            svs.needsUpdate = true
        } 
        if (keyStates["arrowright"] && !keyStates["arrowleft"]) {
            const yRotationQuaternion = Quaternion.fromAxisAngle(
                0, 1, 0, - scale)
            svs.quaternion = svs.quaternion.multiply(yRotationQuaternion)
            svs.needsUpdate = true
        }
        const zoomScale = SV_KEY_ZOOM_SCALE
        if (keyStates["z"] && !keyStates["x"]) {
            svs.zoom /= zoomScale
            svs.zoom = Math.min(Math.max(SV_MIN_ZOOM, svs.zoom), SV_MAX_ZOOM)
            svs.updateGradients()
            svs.needsUpdate = true
        }
        if (keyStates["x"] && !keyStates["z"]) {
            svs.zoom *= zoomScale
            svs.zoom = Math.min(Math.max(SV_MIN_ZOOM, svs.zoom), SV_MAX_ZOOM)
            svs.updateGradients()
            svs.needsUpdate = true
        }
        if (keyStates["a"] && !keyStates["s"]) {
            svs.starFactor *= zoomScale
            svs.starFactor = Math.max(svs.starFactor, SV_MIN_STAR_FACTOR)
            svs.needsUpdate = true
        }
        if (keyStates["s"] && !keyStates["a"]) {
            svs.starFactor /= zoomScale
            svs.needsUpdate = true
        }
    }
}

/**
 * @param {WheelEvent} e 
 * @param {SkyViewState} svs
 */
function handleScroll(e, svs) {
    if (svs.pointerLocked && e.deltaY != 0) {
        const scalingFactor = e.deltaY < 0 ? 1 / SV_WHEEL_SCALE : SV_WHEEL_SCALE
        svs.zoom *= scalingFactor
        svs.zoom = Math.min(Math.max(SV_MIN_ZOOM, svs.zoom), SV_MAX_ZOOM)
        svs.updateGradients()
        svs.needsUpdate = true
    }
}

/**
 * @param {SkyViewState} svs
 * @param {Object<string, boolean>} keyStates
 * @param {MouseEvent} e
 */
function onMouseMove(svs, keyStates, e) {

    if (svs.pointerLocked) {

        let controlScale = 1
        if (e.shiftKey) controlScale = SV_CONTROL_SCALE

        const flipControlStyle = svs.ui.has("reversed-control")
        const ctrlKeyHeld = e.ctrlKey || e.metaKey

        if ((ctrlKeyHeld && !flipControlStyle) || (!ctrlKeyHeld && flipControlStyle )) {

            const xRotationQuaternion = Quaternion.fromAxisAngle(
                1, 0, 0, e.movementY / SV_MOVEMENT_SCALE / svs.zoom /
                    controlScale)
            const yRotationQuaternion = Quaternion.fromAxisAngle(
                0, 1, 0, - e.movementX / SV_MOVEMENT_SCALE / svs.zoom /
                    controlScale)
    
            svs.quaternion = svs.quaternion.multiply(
                xRotationQuaternion).multiply(yRotationQuaternion)
            svs.needsUpdate = true

        } else {
            
            const movementVector = new Vector(e.movementX, e.movementY, 0)
            const transformedY = new Vector(0, -1, 0)
                .transformByQuaternion(svs.quaternion).collapseToXY()
            let zRotation = transformedY.getAngleTo(new Vector(0, -1, 0))

            if (transformedY.x < 0) zRotation = 2 * Math.PI - zRotation

            const rotatedMovement = movementVector.transformByQuaternion(
                Quaternion.fromAxisAngle(0, 0, 1, zRotation))

            xRot = rotatedMovement.x
            yRot = rotatedMovement.y

            // Increase rotation speed near the poles, otherwise it looks slow
            const currentDec = svs.raDec.dec
            const polarMovementScale = 2 - Math.cos(currentDec * Math.PI / 180)

            if (yRot > 0) {
                rotatePositiveDec(svs, yRot / SV_MOVEMENT_SCALE / svs.zoom /
                    controlScale)
            } else {
                rotateNegativeDec(svs, - yRot / SV_MOVEMENT_SCALE / svs.zoom /
                    controlScale)
            }

            if (xRot > 0) {
                rotatePositiveRa(svs, xRot / SV_MOVEMENT_SCALE / svs.zoom /
                    controlScale * polarMovementScale)
            } else {
                rotateNegativeRa(svs, - xRot / SV_MOVEMENT_SCALE / svs.zoom /
                    controlScale * polarMovementScale)
            }
        }
        
    }

}


/**
 * @param {SkyViewState} svs
 * @param {number} scale
 */
function rotatePositiveRa(svs, scale) {
    const polRotationQuaternion = Quaternion.fromAxisAngle(
        0, -1, 0, scale)
    svs.quaternion = svs.quaternion.premultiply(polRotationQuaternion)
    svs.needsUpdate = true
    svs.refreshRaDec()
}

/**
 * @param {SkyViewState} svs
 * @param {number} scale
 */
function rotateNegativeRa(svs, scale) {
    const polRotationQuaternion = Quaternion.fromAxisAngle(
        0, -1, 0, - scale)
    svs.quaternion = svs.quaternion.premultiply(polRotationQuaternion)
    svs.needsUpdate = true
    svs.refreshRaDec()
}


// NOTE: For changing the declination angle, we can't reach the
// poles without risking losing the right ascension value!
/**
 * @param {SkyViewState} svs
 * @param {number} scale
 */
function rotatePositiveDec(svs, scale) {
    const targetVector = new Vector(0, 0, -1).transformByQuaternion(
        svs.quaternion.inverse())
    const angleToSouthPole = targetVector.getAngleTo(
        new Vector(0, 1, 0))
    const rot = Math.min(scale, angleToSouthPole * 0.7)
    const newXAxis = new Vector(
        Math.cos(svs.raRad), 0, - Math.sin(svs.raRad))
    const decRotationQuaternion = Quaternion.fromAxisAngle(
        newXAxis.x, newXAxis.y, newXAxis.z, rot)
    svs.quaternion = svs.quaternion.premultiply(decRotationQuaternion)
    svs.needsUpdate = true
}

/**
 * @param {SkyViewState} svs
 * @param {number} scale
 */
function rotateNegativeDec(svs, scale) {
    const targetVector = new Vector(0, 0, -1).transformByQuaternion(
        svs.quaternion.inverse())
    const angleToNorthPole = targetVector.getAngleTo(
        new Vector(0, -1, 0))
    const rot = Math.min(scale, angleToNorthPole * 0.7)
    const newXAxis = new Vector(
        Math.cos(svs.raRad), 0, - Math.sin(svs.raRad))
    const decRotationQuaternion = Quaternion.fromAxisAngle(
        newXAxis.x, newXAxis.y, newXAxis.z, - rot)
    svs.quaternion = svs.quaternion.premultiply(decRotationQuaternion)
    svs.needsUpdate = true
}

