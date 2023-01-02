function getMenu() {
    return document.getElementById("menu-container")
}

function showMenu() {
    getMenu().style.display = "flex"
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
