/**
 * @param {KeyboardEvent} e
 * @param {SkyViewState} svs
 */
 function handleKeyPress(e, svs) {
    if (svs.pointerLocked) {
        if (e.key === "0") {
            svs.quaternion = Quaternion.identity()
            svs.needsUpdate = true
        }
    }
}

/**
 * @param {Object<string, boolean>} keyStates
 * @param {SkyViewState} svs
 */
function handlePressedKeys(keyStates, svs) {
    if (svs.pointerLocked) {
        const scale = 1 / SV_KEY_MOVEMENT_SCALE / svs.zoom
        if (keyStates[","] && !keyStates["."]) {
            const zRotationQuaternion = Quaternion.fromAxisAngle(
                0, 0, 1, scale)
            svs.quaternion = svs.quaternion.multiply(zRotationQuaternion)
            svs.needsUpdate = true
        }  
        if (keyStates["."] && !keyStates[","]) {
            const zRotationQuaternion = Quaternion.fromAxisAngle(
                0, 0, 1, - scale)
            svs.quaternion = svs.quaternion.multiply(zRotationQuaternion)
            svs.needsUpdate = true
        }
        if (keyStates["ArrowUp"] && !keyStates["ArrowDown"]) {
            const xRotationQuaternion = Quaternion.fromAxisAngle(
                1, 0, 0, - scale)
            svs.quaternion = svs.quaternion.multiply(xRotationQuaternion)
            svs.needsUpdate = true
        } 
        if (keyStates["ArrowDown"] && !keyStates["ArrowUp"]) {
            const xRotationQuaternion = Quaternion.fromAxisAngle(
                1, 0, 0, scale)
            svs.quaternion = svs.quaternion.multiply(xRotationQuaternion)
            svs.needsUpdate = true
        }
        if (keyStates["ArrowLeft"] && !keyStates["ArrowRight"]) {
            const yRotationQuaternion = Quaternion.fromAxisAngle(
                0, 1, 0, scale)
            svs.quaternion = svs.quaternion.multiply(yRotationQuaternion)
            svs.needsUpdate = true
        } 
        if (keyStates["ArrowRight"] && !keyStates["ArrowLeft"]) {
            const yRotationQuaternion = Quaternion.fromAxisAngle(
                0, 1, 0, - scale)
            svs.quaternion = svs.quaternion.multiply(yRotationQuaternion)
            svs.needsUpdate = true
        }
        const zoomScale = SV_KEY_ZOOM_SCALE
        if (keyStates["z"] && !keyStates["x"]) {
            svs.zoom /= zoomScale
            svs.zoom = Math.min(Math.max(SV_MIN_ZOOM, svs.zoom), SV_MAX_ZOOM)
            svs.needsUpdate = true
        }
        if (keyStates["x"] && !keyStates["z"]) {
            svs.zoom *= zoomScale
            svs.zoom = Math.min(Math.max(SV_MIN_ZOOM, svs.zoom), SV_MAX_ZOOM)
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
        svs.needsUpdate = true
    }
}

/**
 * @param {SkyViewState} svs
 * @param {MouseEvent} e
 */
function onMouseMove(svs, e) {

    if (svs.pointerLocked) {

        const xRotationQuaternion = Quaternion.fromAxisAngle(
            1, 0, 0, e.movementY / SV_MOVEMENT_SCALE / svs.zoom)
        const yRotationQuaternion = Quaternion.fromAxisAngle(
            0, 1, 0, - e.movementX / SV_MOVEMENT_SCALE / svs.zoom)

        svs.quaternion = svs.quaternion.multiply(
            xRotationQuaternion).multiply(yRotationQuaternion)
        svs.needsUpdate = true
    }

}
