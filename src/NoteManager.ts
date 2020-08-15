import * as PIXI from "pixi.js"
import { noteData, noteTypes } from "./CustomTypes"
import { NoteRender } from "./NoteRender"

enum Modes {
	select,
	add,
	remove
}

export class NoteManager {
	private container: PIXI.Container
	private notes: noteData[] = []
	private selectedTime = 0
	private mode: Modes = Modes.select

	selectedNote: noteData = { type: 0, time: 0, lane: 0, length: 0, extra: 0 }
	needsRefreshing = false

	constructor(app: PIXI.Application, notes: noteData[]) {
		this.container = new PIXI.Container()

		app.stage.addChild(this.container)
		this.notes = notes
	}

	mouseHandler(ev: MouseEvent, app: PIXI.Application, noteRender: NoteRender) {
		if (this.mode === Modes.add) {
			if (ev.type === "mouseup") {
				if (ev.x > app.renderer.width / 2 - noteRender.uiScale * 2.5 && ev.x < app.renderer.width / 2 - noteRender.uiScale / 2) {
					if (ev.which === 1) {
						let present = false
						for (let note of this.notes) {
							if (note.type === noteTypes.TAP_G && note.time === this.selectedTime) {
								present = true
								break
							}
						}
						if (!present) {
							this.notes.push({
								time: this.selectedTime,
								type: noteTypes.TAP_G,
								length: 0,
								extra: 0,
								lane: 1
							})
						}
					} else {
						let match
						for (let note of this.notes) {
							if (note.type === noteTypes.TAP_G && note.time === this.selectedTime) {
								match = note
								break
							}
						}
						if (match) this.notes.splice(this.notes.indexOf(match), 1)
					}
				} else if (ev.x >= app.renderer.width / 2 + noteRender.uiScale / 2 && ev.x < app.renderer.width / 2 + noteRender.uiScale * 2.5) {
					if (ev.which === 1) {
						let present = false
						for (let note of this.notes) {
							if (note.type === noteTypes.TAP_B && note.time === this.selectedTime) {
								present = true
								break
							}
						}
						if (!present) {
							this.notes.push({
								time: this.selectedTime,
								type: noteTypes.TAP_B,
								length: 0,
								extra: 0,
								lane: 1
							})
						}
					} else {
						let match
						for (let note of this.notes) {
							if (note.type === noteTypes.TAP_B && note.time === this.selectedTime) {
								match = note
								break
							}
						}
						if (match) this.notes.splice(this.notes.indexOf(match), 1)
					}
				} else if (ev.x >= app.renderer.width / 2 - noteRender.uiScale / 2 && ev.x < app.renderer.width / 2 + noteRender.uiScale / 2) {
					if (ev.which === 1) {
						let present = false
						for (let note of this.notes) {
							if (note.type === noteTypes.TAP_R && note.time === this.selectedTime) {
								present = true
								break
							}
						}
						if (!present) {
							this.notes.push({
								time: this.selectedTime,
								type: noteTypes.TAP_R,
								length: 0,
								extra: 0,
								lane: 1
							})
						}
					} else {
						let match
						for (let note of this.notes) {
							if (note.type === noteTypes.TAP_R && note.time === this.selectedTime) {
								match = note
								break
							}
						}
						if (match) this.notes.splice(this.notes.indexOf(match), 1)
					}
				}
				this.notes.sort((a, b) => a.time - b.time)
			} else if (ev.type === "mousemove") {
				/*
                //preview
                if(ev.x > app.renderer.width/2 - noteRender.uiScale * 2.5 && ev.x < app.renderer.width/2 - noteRender.uiScale/2){
                    //green
                } else if(ev.x >= app.renderer.width/2 + noteRender.uiScale/2 && ev.x < app.renderer.width/2 + noteRender.uiScale * 2.5){
                    //blue
                } else {
                    //red
                }
        
                */
				let percent = (app.renderer.height - noteRender.clickerOffset - ev.y) / (app.renderer.height - noteRender.clickerOffset)
				if (percent > 0) {
					let beat = percent * noteRender.timeScale

					let timePartition = 1 / 4

					let closest = Math.round(beat / timePartition)

					this.selectedTime = noteRender.time + closest * timePartition
				}
			}
		} else if (this.mode === Modes.select) {
			if (ev.type === "mouseup" && ev.which === 1) {
				let percent = (app.renderer.height - noteRender.clickerOffset - ev.y) / (app.renderer.height - noteRender.clickerOffset)
				this.selectedTime = noteRender.time + noteRender.timeScale * percent

				let searchList: noteTypes[] = []

				if (ev.x > app.renderer.width / 2 - noteRender.uiScale * 2.5 && ev.x < app.renderer.width / 2 - noteRender.uiScale / 2) {
					searchList = [noteTypes.TAP_G, noteTypes.SCR_G_UP, noteTypes.SCR_G_DOWN, noteTypes.SCR_G_ANYDIR, noteTypes.CF_SPIKE_G]
				} else if (ev.x >= app.renderer.width / 2 + noteRender.uiScale / 2 && ev.x < app.renderer.width / 2 + noteRender.uiScale * 2.5) {
					searchList = [noteTypes.TAP_B, noteTypes.SCR_B_UP, noteTypes.SCR_B_DOWN, noteTypes.SCR_B_ANYDIR, noteTypes.CF_SPIKE_B]
				} else {
					searchList = [noteTypes.TAP_R]
				}

				for (let n of this.notes) {
					if (n.selected) {
						n.selected = false
					}
					if (searchList.includes(n.type) && Math.abs(n.time - this.selectedTime) < noteRender.timeScale / 20) {
						this.selectedNote = n
						n.selected = true
						this.needsRefreshing = true
					}
				}
			}
		}
	}
}
