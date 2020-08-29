import * as PIXI from "pixi.js"
import { noteData, getTypeStringName, noteTypes } from "./CustomTypes"
import { NoteRender } from "./NoteRender"
import { Howl,Howler } from "howler"
import { NoteLoader } from "./NoteLoader"
import { NoteExporter } from "./NoteExporter"
import { NoteManager, NoteClass, Modes } from "./NoteManager"

let app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight
})
document.body.appendChild(app.view)

let notes: noteData[] = [
    {
        type: noteTypes.BPM,
        time: 0,
        extra: 120,
        lane: 1,
        length: 0
    },
    {
        type: noteTypes.CROSS_C,
        time: 0,
        lane: 1,
        length: 0,
        extra: 0
    }
]
let noteRender = new NoteRender(app)
let noteManager = new NoteManager(app, notes)

let needsRefresh = false

let timeWarp = 1.5
let songBpm = 120

let greenAudioSource = new Howl({ src: [""] })
let redAudioSource = new Howl({ src: [""] })
let blueAudioSource = new Howl({ src: [""] })

let divStartPosition = { x: 0, y: 0 }
let divMainPosition = { x: 10, y: 10 }
let divTooltipPosition = { x: 10, y: 10 }
let dragStart = { x: -1, y: -1 }
let isDragging: HTMLElement | null = null

let divMain = <HTMLDivElement>document.getElementById("divMain")
let divTooltip = <HTMLDivElement>document.getElementById("divTooltip")
let divTooltipTable = <HTMLTableElement>document.getElementById("tableTooltip")

let inputBPM = <HTMLInputElement>document.getElementById("inputBPM")
let inputPos = <HTMLInputElement>document.getElementById("inputPos")
let inputTimeScale = <HTMLInputElement>document.getElementById("inputTimeScale")
let inputUIScale = <HTMLInputElement>document.getElementById("inputUIScale")
let inputBPMRes = <HTMLInputElement>document.getElementById("inputBPMRes")

let divClassSelector = <HTMLDivElement>document.getElementById("divClass")

let divModes = <HTMLDivElement>document.getElementById("divModes")

let inputNoteType = <HTMLSelectElement>document.getElementById("inputNoteType")
let inputNoteTime = <HTMLInputElement>document.getElementById("inputNoteTime")
let inputNoteLength = <HTMLInputElement>document.getElementById("inputNoteLength")
let inputNoteExtra = <HTMLInputElement>document.getElementById("inputNoteExtra")

Array.from(document.getElementsByClassName("topBar")).forEach((bar) => {
    ;(<HTMLDivElement>bar).addEventListener("mousedown", (ev) => {
        if (bar.parentElement !== null) {
            divStartPosition.x = Number(getComputedStyle(bar.parentElement).left.slice(0, -2))
            divStartPosition.y = Number(getComputedStyle(bar.parentElement).top.slice(0, -2))

            dragStart = { x: ev.x, y: ev.y }
            isDragging = bar.parentElement
        }
    })
})

let arr = Array.from(document.getElementsByClassName("tabButton"))
for (let i = 0; i < arr.length; ++i) {
    ;(<HTMLButtonElement>arr[i]).addEventListener("click", (ev) => {
        let others = Array.from(document.getElementsByClassName("tabButton"))
        for (let o of others) {
            o.classList.remove("selected")
        }
        ;(<HTMLButtonElement>ev.srcElement).classList.add("selected")
        let div = document.getElementById("divView")
        if (div) {
            let c = Array.from(div.children)
            for (let j = 0; j < c.length; ++j) {
                if (j === i) {
                    ;(<HTMLDivElement>c[j]).style.display = "block"
                } else {
                    ;(<HTMLDivElement>c[j]).style.display = "none"
                }
            }
        }
    })
}

document.getElementById("inputBPM")?.addEventListener("change", (ev) => {
    if (ev.srcElement) {
        let value = Number((<HTMLInputElement>ev.srcElement).value)
        if (value >= 1) {
            for (let n of notes) {
                if (n.type === noteTypes.BPM) n.extra = value
            }
        }
    }
})

document.getElementById("inputPos")?.addEventListener("change", (ev) => {
    if (ev.srcElement) {
        let t = Number((<HTMLInputElement>ev.srcElement).value)
        if (t >= 0) noteRender.time = t
    }
})

document.getElementById("inputTimeScale")?.addEventListener("change", (ev) => {
    if (ev.srcElement) {
        let scale = Number((<HTMLInputElement>ev.srcElement).value)
        if (scale >= 0.2) timeWarp = scale
    }
})

document.getElementById("inputUIScale")?.addEventListener("change", (ev) => {
    if (ev.srcElement) {
        let scale = Number((<HTMLInputElement>ev.srcElement).value)
        if (scale >= 50) noteRender.setScale(scale)
    }
})

document.getElementById("inputBPMRes")?.addEventListener("change", (ev) => {
    if (ev.srcElement) {
        let v = Number((<HTMLInputElement>ev.srcElement).value)
        noteRender.bpmResolution = v >= 1 ? 1 / v : 0.25
    }
})

document.getElementById("inputNoteType")?.addEventListener("change", (ev) => {
    if (ev.srcElement) noteManager.selectedNote.type = Number((<HTMLSelectElement>ev.srcElement).value)
})

document.getElementById("inputNoteTime")?.addEventListener("change", (ev) => {
    if (ev.srcElement) {
        let t = Number((<HTMLInputElement>ev.srcElement).value)
        if (t >= 0) noteManager.selectedNote.time = t
    }
})

document.getElementById("inputNoteLength")?.addEventListener("change", (ev) => {
    if (ev.srcElement) {
        let t = Number((<HTMLInputElement>ev.srcElement).value)
        if (t >= 0) noteManager.selectedNote.length = t
    }
})

document.getElementById("inputNoteExtra")?.addEventListener("change", (ev) => {
    if (ev.srcElement) noteManager.selectedNote.extra = Number((<HTMLInputElement>ev.srcElement).value)
})

document.getElementById("inputShortcutsToggle")?.addEventListener("change",ev =>{
    if(ev.srcElement && divTooltip) {
        divTooltip.style.display = (<HTMLInputElement>ev.srcElement).checked ? "block" : "none"
    }
})

document.getElementById("inputTickTime")?.addEventListener("change",ev =>{
    if(ev.srcElement && noteRender) {
        noteRender.bpmTickTimeVisible = (<HTMLInputElement>ev.srcElement).checked
    }
})


document.getElementById("divDropGreen")?.addEventListener("click",ev =>{
    //console.log(ev)
    let input = document.createElement("input")
    input.type = "file"
    input.addEventListener("change", (ev) => {
        if(input.files){
            let file = input.files[0]

            //console.log(fileArray)
            toBase64(file)
                .then((res) => {
                    if (res.includes("data:audio")) {
                        greenAudioSource = new Howl({ src: [res] })
                        console.log("loaded green track")
                        }
                    })
                .catch((err) => console.error("LOADING FILE ERROR", err))
        }
    })
    input.click()
})
document.getElementById("divDropGreen")?.addEventListener("drop",ev =>{
    if(ev.dataTransfer){
        let file = ev.dataTransfer.files[0]
        toBase64(file)
            .then((res) => {
                if (res.includes("data:audio")) {
                    greenAudioSource = new Howl({ src: [res] })
                    console.log("loaded green track")
                }
            })
            .catch((err) => console.error("LOADING FILE ERROR", err))
    }
    if(ev.srcElement){
        (<HTMLDivElement>ev.srcElement).classList.remove("selected")
    }
    ev.preventDefault()
})
document.getElementById("divDropGreen")?.addEventListener("dragenter",ev => {
    if(ev.srcElement){
        (<HTMLDivElement>ev.srcElement).classList.add("selected")
    }
    ev.preventDefault()
})
document.getElementById("divDropGreen")?.addEventListener("dragleave",ev => {
    if(ev.target){
        (<HTMLDivElement>ev.srcElement).classList.remove("selected")
    }
    ev.preventDefault()
})

document.getElementById("divDropRed")?.addEventListener("click",ev =>{
    //console.log(ev)
    let input = document.createElement("input")
    input.type = "file"
    input.addEventListener("change", (ev) => {
        if(input.files){
            let file = input.files[0]

            //console.log(fileArray)
            toBase64(file)
                .then((res) => {
                    if (res.includes("data:audio")) {
                        redAudioSource = new Howl({ src: [res] })
                        console.log("loaded green track")
                        }
                    })
                .catch((err) => console.error("LOADING FILE ERROR", err))
        }
    })
    input.click()
})
document.getElementById("divDropRed")?.addEventListener("drop",ev =>{
    if(ev.dataTransfer){
        let file = ev.dataTransfer.files[0]
        toBase64(file)
            .then((res) => {
                if (res.includes("data:audio")) {
                    redAudioSource = new Howl({ src: [res] })
                    console.log("loaded green track")
                }
            })
            .catch((err) => console.error("LOADING FILE ERROR", err))
    }
    if(ev.srcElement){
        (<HTMLDivElement>ev.srcElement).classList.remove("selected")
    }
    ev.preventDefault()
})
document.getElementById("divDropRed")?.addEventListener("dragenter",ev => {
    if(ev.srcElement){
        (<HTMLDivElement>ev.srcElement).classList.add("selected")
    }
    ev.preventDefault()
})
document.getElementById("divDropRed")?.addEventListener("dragleave",ev => {
    if(ev.target){
        (<HTMLDivElement>ev.srcElement).classList.remove("selected")
    }
    ev.preventDefault()
})

document.getElementById("divDropBlue")?.addEventListener("click",ev =>{
    //console.log(ev)
    let input = document.createElement("input")
    input.type = "file"
    input.addEventListener("change", (ev) => {
        if(input.files){
            let file = input.files[0]

            //console.log(fileArray)
            toBase64(file)
                .then((res) => {
                    if (res.includes("data:audio")) {
                        blueAudioSource = new Howl({ src: [res] })
                        console.log("loaded green track")
                        }
                    })
                .catch((err) => console.error("LOADING FILE ERROR", err))
        }
    })
    input.click()
})
document.getElementById("divDropBlue")?.addEventListener("drop",ev =>{
    if(ev.dataTransfer){
        let file = ev.dataTransfer.files[0]
        toBase64(file)
            .then((res) => {
                if (res.includes("data:audio")) {
                    blueAudioSource = new Howl({ src: [res] })
                    console.log("loaded green track")
                }
            })
            .catch((err) => console.error("LOADING FILE ERROR", err))
    }
    if(ev.srcElement){
        (<HTMLDivElement>ev.srcElement).classList.remove("selected")
    }
    ev.preventDefault()
})
document.getElementById("divDropBlue")?.addEventListener("dragenter",ev =>{
    if(ev.srcElement){
        (<HTMLDivElement>ev.srcElement).classList.add("selected")
    }
    ev.preventDefault()
})
document.getElementById("divDropBlue")?.addEventListener("dragleave",ev =>{
    if(ev.target){
        (<HTMLDivElement>ev.srcElement).classList.remove("selected")
    }
    ev.preventDefault()
})

document.getElementById("divDropChart")?.addEventListener("click",ev =>{
    //console.log(ev)
    let input = document.createElement("input")
    input.type = "file"
    input.addEventListener("change", (ev) => {
        if(input.files){
            let file = input.files[0]
            if(file.name.toLowerCase().includes(".xmk")){
                NoteLoader.parseChart(file, notes).then((bpm) => {
                    songBpm = bpm ? bpm : 120
                    updateGUI()
                })
            }
        }
    })
    input.click()
})
document.getElementById("divDropChart")?.addEventListener("drop",ev =>{
    if(ev.dataTransfer){
        let file = ev.dataTransfer.files[0]
        if(file.name.toLowerCase().includes(".xmk")){
            NoteLoader.parseChart(file, notes).then((bpm) => {
                songBpm = bpm ? bpm : 120
                updateGUI()
            })
        }
    }
    if(ev.srcElement){
        (<HTMLDivElement>ev.srcElement).classList.remove("selected")
    }
    ev.preventDefault()
})
document.getElementById("divDropChart")?.addEventListener("dragenter",ev =>{
    if(ev.srcElement){
        (<HTMLDivElement>ev.srcElement).classList.add("selected")
    }
    ev.preventDefault()
})
document.getElementById("divDropChart")?.addEventListener("dragleave",ev =>{
    if(ev.target){
        (<HTMLDivElement>ev.srcElement).classList.remove("selected")
    }
    ev.preventDefault()
})

document.getElementById("divDropGreen")?.addEventListener("dragover",ev => ev.preventDefault())
document.getElementById("divDropRed")?.addEventListener("dragover",ev => ev.preventDefault())
document.getElementById("divDropBlue")?.addEventListener("dragover",ev =>ev.preventDefault())
document.getElementById("divDropChart")?.addEventListener("dragover",ev =>ev.preventDefault())

document.getElementById("inputSliderGreen")?.addEventListener("change",ev =>{
    if(ev.srcElement){
        greenAudioSource.volume(Number((<HTMLInputElement>ev.srcElement).value))
    }
})

document.getElementById("inputSliderRed")?.addEventListener("change",ev =>{
    if(ev.srcElement){
        redAudioSource.volume(Number((<HTMLInputElement>ev.srcElement).value))
    }
})

document.getElementById("inputSliderBlue")?.addEventListener("change",ev =>{
    if(ev.srcElement){
        blueAudioSource.volume(Number((<HTMLInputElement>ev.srcElement).value))
    }
})

window.addEventListener("resize", () => {
    app.renderer.resize(window.innerWidth, window.innerHeight)
})

window.addEventListener("mousedown", (ev) => {
    if ((<HTMLElement>ev.target).tagName === "CANVAS") noteManager.mouseHandler(ev, app, noteRender, songBpm)
})

window.addEventListener("mousemove", (ev) => {
    if (isDragging === divMain) {
        let currentPos = { x: ev.x, y: ev.y }

        divMainPosition.x = divStartPosition.x + currentPos.x - dragStart.x
        divMainPosition.y = divStartPosition.y + currentPos.y - dragStart.y
        updateGUI()
    } else if (isDragging === divTooltip) {
        let currentPos = { x: ev.x, y: ev.y }

        divTooltipPosition.x = divStartPosition.x + currentPos.x - dragStart.x
        divTooltipPosition.y = divStartPosition.y + currentPos.y - dragStart.y
        updateGUI()
    }
    if ((<HTMLElement>ev.target).tagName === "CANVAS") noteManager.mouseHandler(ev, app, noteRender, songBpm)
})

window.addEventListener("mouseup", (ev) => {
    divStartPosition = { x: 0, y: 0 }
    dragStart = { x: ev.x, y: ev.y }
    isDragging = null
    if ((<HTMLElement>ev.target).tagName === "CANVAS") noteManager.mouseHandler(ev, app, noteRender, songBpm)
})

window.addEventListener("dblclick", (ev) => ev.preventDefault())

window.addEventListener("contextmenu", (ev) => ev.preventDefault())

window.addEventListener("wheel", (delta) => {
    noteRender.moveView(-delta.deltaY,notes,songBpm)
    updateGUI()
})
window.addEventListener("keyup", (ev) => keyPress(ev))

function init() {
    for (let t in noteTypes) {
        if (!isNaN(Number(t))) {
            let elm = document.createElement("option")
            elm.value = t
            elm.text = getTypeStringName(Number(t))
            inputNoteType.options.add(elm)
        }
    }
    for (let i = 0; i < divClassSelector.children.length; ++i) {
        divClassSelector.children[i].addEventListener("click", (ev) => {
            noteManager.setNoteClass(i)
            updateGUI()
        })
        divClassSelector.children[i].addEventListener("dragstart", (ev) => ev.preventDefault())
    }

    divModes.children[0].addEventListener("click", (ev) => {
        noteManager.setMode(Modes.add)
        updateGUI()
    })
    divModes.children[0].addEventListener("dragstart", (ev) => ev.preventDefault())

    divModes.children[1].addEventListener("click", (ev) => {
        noteManager.setMode(Modes.select)
        updateGUI()
    })
    divModes.children[1].addEventListener("dragstart", (ev) => ev.preventDefault())

    divModes.children[2].addEventListener("click", (ev) => {
        noteManager.setMode(Modes.delete)
        updateGUI()
    })
    divModes.children[2].addEventListener("dragstart", (ev) => ev.preventDefault())
}

init()

app.ticker.add((delta) => {
    if (greenAudioSource.playing()) {
        let time = greenAudioSource.seek()
        if (typeof time == "number") noteRender.setViewOffset(time / (240 / songBpm))
        updateGUI()
    } else {
        greenAudioSource.seek(noteRender.time * (240 / songBpm))
        redAudioSource.seek(noteRender.time * (240 / songBpm))
        blueAudioSource.seek(noteRender.time * (240 / songBpm))
    }
    noteRender.setTimeScale(timeWarp)
    noteRender.bpmRender(app, notes, songBpm)
    noteRender.draw(app, notes)

    needsRefresh = noteManager.needsRefreshing
    if (needsRefresh) {
        updateGUI()
        noteManager.needsRefreshing = false
    }
})

function keyPress(ev: KeyboardEvent) {
    //console.log(ev)
    if ((<HTMLElement>ev.target).tagName === "BODY") {
        if (ev.key == "Home" && !greenAudioSource.playing()) {
            noteRender.setViewOffset(0)
        } else if (ev.key == " ") {
            if (greenAudioSource.playing()) {
                greenAudioSource.stop()
                redAudioSource.stop()
                blueAudioSource.stop()
            } else {
                greenAudioSource.play()
                redAudioSource.play()
                blueAudioSource.play()
            }
        } else if (ev.key == "-") {
            timeWarp += 0.1
            updateGUI()
        } else if (ev.key == "=") {
            timeWarp -= timeWarp >= 0.2 ? 0.1 : 0.0
            updateGUI()
        } else if (ev.key == "l") {
            let input = document.createElement("input")
            input.setAttribute("webkitdirectory", "true")
            input.type = "file"
            input.addEventListener("change", (ev) => {
                let fileArray = Array.from(input.files || [])

                //console.log(fileArray)
                fileArray.forEach((file) => {
                    if (file.name.includes(".xmk")) {
                        //console.log("parsing", file)
                        NoteLoader.parseChart(file, notes).then((bpm) => {
                            songBpm = bpm ? bpm : 120
                            //console.log(notes)
                            updateGUI()
                        })
                    } else {
                        toBase64(file)
                            .then((res) => {
                                if (res.includes("data:audio")) {
                                    greenAudioSource = new Howl({ src: [res] })
                                    console.log("loaded song")
                                }
                            })
                            .catch((err) => console.error("LOADING FILE ERROR", err))
                    }
                })
            })
            input.click()
        } else if (ev.key === "k") {
            NoteExporter.exportToFile(notes)
        } else if (ev.key === "c") {
            NoteExporter.cleanupNotes(notes)
        } else {
            noteManager.keyHandler(ev, app, noteRender, songBpm)
        }
    }
}

function updateGUI() {
    divMain.style.left = divMainPosition.x + "px"
    divMain.style.top = divMainPosition.y + "px"

    for (let n of notes) {
        if (n.type === noteTypes.BPM) songBpm = n.extra
    }

    inputBPM.value = songBpm.toFixed(3)
    inputPos.value = noteRender.time.toFixed(3)
    inputTimeScale.value = timeWarp.toFixed(3)
    inputUIScale.value = noteRender.uiScale.toFixed(0)
    inputBPMRes.value = (1 / noteRender.bpmResolution).toString()

    let cls = noteManager.noteClass

    let children = divClassSelector.children

    for (let c of children) {
        c.classList.remove("selected")
    }

    if (cls === NoteClass.TAP) children[0].classList.add("selected")
    else if (cls === NoteClass.SCRATCH) children[1].classList.add("selected")
    else if (cls === NoteClass.CROSS) children[2].classList.add("selected")
    else if (cls === NoteClass.FX) children[3].classList.add("selected")
    else if (cls === NoteClass.FS) children[4].classList.add("selected")
    else if (cls === NoteClass.EVENTS) children[5].classList.add("selected")

    let mode = noteManager.mode

    if (mode === Modes.add) {
        divModes.children[0].classList.add("selected")
        divModes.children[1].classList.remove("selected")
        divModes.children[2].classList.remove("selected")
    } else if (mode === Modes.select) {
        divModes.children[0].classList.remove("selected")
        divModes.children[1].classList.add("selected")
        divModes.children[2].classList.remove("selected")
    } else if (mode === Modes.delete) {
        divModes.children[0].classList.remove("selected")
        divModes.children[1].classList.remove("selected")
        divModes.children[2].classList.add("selected")
    }

    //tooltip
    let firstRowText = ["", "", ""]
    let secondRowText = ["", "", ""]

    if (mode === Modes.add) {
        divTooltipTable.style.display = "table"
        if (cls === NoteClass.TAP) {
            firstRowText = [getTypeStringName(noteTypes.TAP_G), getTypeStringName(noteTypes.TAP_R), getTypeStringName(noteTypes.TAP_B)]
            secondRowText = ["", "", ""]
        } else if (cls === NoteClass.SCRATCH) {
            firstRowText = [getTypeStringName(noteTypes.SCR_G_UP), "", getTypeStringName(noteTypes.SCR_B_UP)]
            secondRowText = [getTypeStringName(noteTypes.SCR_G_DOWN), "", getTypeStringName(noteTypes.SCR_B_DOWN)]
        } else if (cls === NoteClass.CROSS) {
            firstRowText = [getTypeStringName(noteTypes.CROSS_G), getTypeStringName(noteTypes.CROSS_C), getTypeStringName(noteTypes.CROSS_B)]
            secondRowText = [getTypeStringName(noteTypes.CF_SPIKE_G), getTypeStringName(noteTypes.CF_SPIKE_C), getTypeStringName(noteTypes.CF_SPIKE_B)]
        } else if (cls === NoteClass.FX) {
            firstRowText = [getTypeStringName(noteTypes.FX_G), getTypeStringName(noteTypes.FX_ALL), getTypeStringName(noteTypes.FX_B)]
            secondRowText = ["", "", ""]
        } else if (cls === NoteClass.FS) {
            firstRowText = [getTypeStringName(noteTypes.FS_CROSS), getTypeStringName(noteTypes.FS_SAMPLES), getTypeStringName(noteTypes.FS_CROSS)]
            secondRowText = [getTypeStringName(noteTypes.FS_CF_G_MARKER), "", getTypeStringName(noteTypes.FS_CF_B_MARKER)]
        } else if (cls === NoteClass.EVENTS) {
            firstRowText = [getTypeStringName(noteTypes.SCR_G_ZONE), getTypeStringName(noteTypes.EUPHORIA), getTypeStringName(noteTypes.SCR_B_ZONE)]
            secondRowText = ["", "", ""]
        }
    } else {
        divTooltipTable.style.display = "none"
    }

    let firstRow = divTooltipTable.children[1].children[1]
    let secondRow = divTooltipTable.children[1].children[2]

    firstRow.children[1].innerHTML = firstRowText[0]
    firstRow.children[2].innerHTML = firstRowText[1]
    firstRow.children[3].innerHTML = firstRowText[2]

    secondRow.children[1].innerHTML = secondRowText[0]
    secondRow.children[2].innerHTML = secondRowText[1]
    secondRow.children[3].innerHTML = secondRowText[2]

    divTooltipPosition.x = app.renderer.width - Number(getComputedStyle(divTooltip).width.slice(0, -2)) - 10

    divTooltip.style.left = divTooltipPosition.x + "px"
    divTooltip.style.top = divTooltipPosition.y + "px"

    //note editor

    let index = -1
    for (let i = 0; i < inputNoteType.options.length; ++i) {
        //console.log(t)
        if (Number(inputNoteType.options[i].value) === noteManager.selectedNote.type) index = i
    }

    inputNoteType.selectedIndex = index
    inputNoteTime.value = noteManager.selectedNote.time.toString()
    inputNoteLength.value = noteManager.selectedNote.length.toString()
    inputNoteExtra.value = noteManager.selectedNote.extra.toString()
}

updateGUI()

function toBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
            if (reader.result && typeof reader.result === "string") resolve(reader.result)
        }
        reader.onerror = (error) => reject(error)
    })
}
