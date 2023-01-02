const toggleable_settings = {
    "star-names":               "Names of all stars",
    "crosshairs":               "Crosshairs",
    "star-sizes":               "Magnitude of stars displayed via size",
    "constellation-boundaries": "Constellation boundaries",
    "star-opacity":             "Magnitude of stars displayed via opacity",
    "stars":                    "All stars",
    "globe":                    "Arcs of right ascension and declination",
    "reversed-control":         "Reversed control",
    "decimal-display":          "Decimal display",
    "movie":                    "Auto-rotate (movie)",
    "constellation-lines":      "Constellation lines",
    "highlight-const":          "Highlight constellation",
    "stat":                     "Location (RA/dec)",
    "extra":                    "Nearest star and constellation information"
}

function getMenu() {
    return document.getElementById("menu-container")
}

/**
 * @param {SkyViewState} svs
 */
function showMenu(svs) {
    getMenu().style.display = "flex"

    let settingsContentDiv = document.getElementById("settings-content")
    while (settingsContentDiv.firstChild) 
        settingsContentDiv.removeChild(settingsContentDiv.firstChild);

    const toggleTable = document.createElement("table")
    toggleTable.id = "toggle-table"
    
    for (const key in toggleable_settings) {
        const tr = document.createElement("tr")

        const infoTd = document.createElement("td")
        const checkboxTd = document.createElement("td")

        const checkboxDiv = document.createElement("div")
        checkboxTd.appendChild(checkboxDiv)

        checkboxDiv.addEventListener("click", (e) => {
            svs.ui.toggle(key)
            if (svs.ui.has(key)) checkboxDiv.classList.add("checked");
            else checkboxDiv.classList.remove("checked");
            svs.needsUpdate = true
        }, false)

        infoTd.innerText = toggleable_settings[key]
        checkboxDiv.classList.add("menu-checkbox")
        if (svs.ui.has(key)) checkboxDiv.classList.add("checked");

        tr.appendChild(infoTd)
        tr.appendChild(checkboxTd)
        toggleTable.appendChild(tr)
    }

    const valueTable = document.createElement("table")
    valueTable.id = "value-table"
    
    const zoomTr = document.createElement("tr")
    const starTr = document.createElement("tr")
    const colorTr = document.createElement("tr")


    const zoomInfo = document.createElement("td")
    const zoomControl = document.createElement("td")
    zoomInfo.innerText = "Zoom factor"
    const zoomInput = document.createElement("input")
    zoomInput.type = "number"
    zoomInput.step = "0.001"
    zoomInput.min = SV_MIN_ZOOM.toString()
    zoomInput.value = Math.round(svs.zoom * 1e3) / 1e3
    zoomInput.addEventListener("input", (e) => {
        svs.zoom = Math.max(zoomInput.value, 0.5)
        svs.needsUpdate = true
    })
    zoomControl.appendChild(zoomInput)
    zoomTr.appendChild(zoomInfo)
    zoomTr.appendChild(zoomControl)

    const starInfo = document.createElement("td")
    const starControl = document.createElement("td")
    starInfo.innerText = "Star visibility factor"
    const starInput = document.createElement("input")
    starInput.type = "number"
    starInput.step = "0.001"
    starInput.min = SV_MIN_STAR_FACTOR.toString()
    starInput.value = Math.round(svs.starFactor * 1e3) / 1e3
    starInput.addEventListener("input", (e) => {
        svs.starFactor = Math.max(starInput.value, SV_MIN_STAR_FACTOR)
        svs.needsUpdate = true
    }, false)
    starControl.appendChild(starInput)
    starTr.appendChild(starInfo)
    starTr.appendChild(starControl)

    const colorInfo = document.createElement("td")
    const colorControl = document.createElement("td")
    colorInfo.innerText = "Color scheme"
    const colorSelect = document.createElement("select")
    for (const name of svs.colorSchemeNames) {
        const option = document.createElement("option")
        option.innerText = name
        option.value = name
        if (name === svs.selectedColorScheme) option.selected = true;
        colorSelect.appendChild(option)
    }
    colorSelect.addEventListener("change", (e) => {
        svs.setColorScheme(colorSelect.value)
        svs.needsUpdate = true
    }, false)
    colorControl.appendChild(colorSelect)
    colorTr.appendChild(colorInfo)
    colorTr.appendChild(colorControl)


    valueTable.appendChild(zoomTr)
    valueTable.appendChild(starTr)
    valueTable.appendChild(colorTr)

    settingsContentDiv.appendChild(toggleTable)
    settingsContentDiv.appendChild(valueTable)

}

function hideMenu() {
    getMenu().style.display = "none"
}

/**
 * @param {HTMLTableCellElement} element
 */
function selectMenuTab(element) {
    const tr = element.parentElement
    const tds = tr.children
    for (const td of tds) {
        td.classList.remove("selected")
    }
    element.classList.add("selected")

    const contentPanels = document.getElementById("menu-content").children
    for (const panel of contentPanels) {
        panel.style.display = "none"
    }

    document.getElementById(element.id + "-content").style.display = "block"
}
