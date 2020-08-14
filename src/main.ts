import * as PIXI from "pixi.js"
import { noteData } from "./CustomTypes"
import { NoteRender } from "./NoteRender"
import { Howl } from "howler"
import { NoteLoader } from "./noteLoader"
import { NoteExporter } from "./NoteExporter"
import { NoteManager } from "./NoteManager"

let app = new PIXI.Application({
	width: window.innerWidth,
	height: window.innerHeight
})
document.body.appendChild(app.view)

let inputBPM = <HTMLInputElement>document.getElementById("inputBPM")
let inputPos = <HTMLInputElement>document.getElementById("inputPos")
let inputTimeScale = <HTMLInputElement>document.getElementById("inputTimeScale")
let inputUIScale = <HTMLInputElement>document.getElementById("inputUIScale")

let inputNoteType = <HTMLInputElement>document.getElementById("inputNoteType")
let inputNoteTime = <HTMLInputElement>document.getElementById("inputNoteTime")
let inputNoteLength = <HTMLInputElement>document.getElementById("inputNoteLength")

let notes: noteData[] = []
let noteRender = new NoteRender(app)
let noteManager = new NoteManager(app,notes)

let needsRefresh = false

let timeWarp = 1.5
let songBpm = 120

let sound = new Howl({ src: [""] })
sound.volume(0.25)

app.ticker.add((delta) => {
	if (sound.playing()) {
		let time = sound.seek()
		if (typeof time == "number") noteRender.setViewOffset(time / (240 / songBpm))
		updateGUI()
	} else {
		sound.seek(noteRender.time * (240 / songBpm))
	}
	noteRender.setTimeScale(timeWarp)
	noteRender.bpmRender(app,notes,songBpm)
	noteRender.draw(app, notes)

	needsRefresh = noteManager.needsRefreshing
	if(needsRefresh){
		updateGUI()
		noteManager.needsRefreshing = false
	}
})

window.addEventListener("resize", () => {
	app.renderer.resize(window.innerWidth, window.innerHeight)
})

window.addEventListener("mouseup", ev => noteManager.mouseHandler(ev,app,noteRender))
window.addEventListener("mousemove",ev => noteManager.mouseHandler(ev,app,noteRender))

window.addEventListener("dblclick",ev => ev.preventDefault())

window.addEventListener("contextmenu",ev => ev.preventDefault())

window.addEventListener("wheel", (delta) => noteRender.moveView(-delta.deltaY))
window.addEventListener("keyup", (ev) => keyPress(ev))

function keyPress(ev: KeyboardEvent) {
	//console.log(ev)
	if (ev.key == " ") {
		if (sound.playing()) {
			sound.stop()
		} else {
			sound.play()
		}
	} else if (ev.key == "-") {
		timeWarp += 0.1
		updateGUI()
	} else if (ev.key == "=") {
		timeWarp -= 0.1
		updateGUI()
	} else if (ev.key == "l") {
		let input = document.createElement("input")
		input.setAttribute("webkitdirectory", "true")
		input.type = "file"
		input.addEventListener("change", (ev) => {
			let fileArray = Array.from(input.files || [])

			fileArray.forEach((file) => {
				if (file.name.includes(".xmk")) {
					NoteLoader.parseChart(file, notes).then((bpm) => {
						songBpm = bpm ? bpm : 120
						updateGUI()
					})
				} else if (file.name.includes(".ogg")) {
					toBase64(file)
						.then((res) => {
							if (res) {
								sound = new Howl({ src: [res] })
							}
							console.log("loaded song")
						})
						.catch((err) => console.error("LOADING FILE ERROR", err))
				}
			})
		})
		input.click()
	} else if (ev.key === "e") {
		NoteExporter.exportToFile(notes)
	}
}

document.getElementById("inputBPM")?.addEventListener("change", (ev) => {
	if (ev.srcElement) songBpm = Number((<HTMLInputElement>ev.srcElement).value)
})

document.getElementById("inputPos")?.addEventListener("change", (ev) => {
	if (ev.srcElement) noteRender.time = Number((<HTMLInputElement>ev.srcElement).value)
})

document.getElementById("inputTimeScale")?.addEventListener("change", (ev) => {
	if (ev.srcElement) timeWarp = Number((<HTMLInputElement>ev.srcElement).value)
})

document.getElementById("inputUIScale")?.addEventListener("change", (ev) => {
	if (ev.srcElement) noteRender.setScale(Number((<HTMLInputElement>ev.srcElement).value))
})

function updateGUI() {
	inputBPM.value = songBpm.toFixed(2)
	inputPos.value = noteRender.time.toFixed(2)
	inputTimeScale.value = timeWarp.toFixed(2)
	inputUIScale.value = noteRender.uiScale.toFixed(2)

	inputNoteType.value = noteManager.selectedNote.type.toString()
	inputNoteTime.value = noteManager.selectedNote.time.toString()
	inputNoteLength.value = noteManager.selectedNote.length.toString()
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
