function loaded() {
    const hostDiv = document.getElementById("blocker")

    const sky = document.createElement("div")
    sky.classList.add("sky-holder")

    const meridianCount = 10
    const sepDegrees = 180 / meridianCount
    for (let i = 0; i < meridianCount; i++) {
        const meridian = document.createElement("div")
        const rot = i * sepDegrees
        meridian.classList.add("sky-meridian")
        meridian.style.transform = `rotateY(${rot}deg)`
        sky.appendChild(meridian)
    } 

    hostDiv.appendChild(sky)
    addSlider("rotation", 0, 360, 0, (d) => {
        sky.style.transform = `rotateY(${d}deg)`
    })
}

/**
 * @param {string} label
 * @param {number} min - minimum value of slider
 * @param {number} max - maximum value of slider
 * @param {number} value - initial value of slider
 * @param {function} onChange - function called when value changes
 * @param {number} step - if 0, continuous, otherwise discrete
 */
function addSlider(label, min, max, value, 
        onChange = () => {}, step = 0) {

    const hostDiv = document.getElementById("sliders")
    const tr = document.createElement("tr")
    const td1 = document.createElement("td")
    const td2 = document.createElement("td")
    
    td1.innerText = label

    const slider = document.createElement("input")

    slider.type = "range"
    slider.min = min
    slider.max = max
    slider.value = value
    if (step !== 0) slider.step = step; else step = "any"
    slider.oninput = (e) => onChange(e.target.value)

    hostDiv.appendChild(tr)
    tr.appendChild(td1)
    tr.appendChild(td2)
    td2.appendChild(slider)
}