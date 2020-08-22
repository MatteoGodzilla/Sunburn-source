import * as PIXI from "pixi.js"
import { noteData, noteTypes } from "./CustomTypes"
import { NoteRender } from "./NoteRender"
import { NoteLoader } from "./NoteLoader";

export enum Modes {
	add,
	select,
	delete
}

export enum NoteClass {
	TAP,
	SCRATCH,
	CROSS,
	FX,
	FS,
	EVENTS
}

export class NoteManager {
	private container: PIXI.Container
	private notes: noteData[] = []
	private selectedTime = 0
	mode = Modes.select
	noteClass = NoteClass.TAP
	private lastCandidates: noteData[] = []
	private lastCandidateIndex = 0

	selectedNote: noteData = { type: 0, time: 0, lane: 0, length: 0, extra: 0 }
	needsRefreshing = false

	constructor(app: PIXI.Application, notes: noteData[]) {
		this.container = new PIXI.Container()

		app.stage.addChild(this.container)
		this.notes = notes
	}

	mouseHandler(ev: MouseEvent, app: PIXI.Application, noteRender: NoteRender,baseBPM:number) {
		let lane = this.getLane(ev, app, noteRender.uiScale)

		if(ev.type === "mousedown"){
			if(ev.which === 1){
				if(this.mode === Modes.add){
					let mouseTime = this.getTimeFromY(ev,app,noteRender)
	
					let lastBPMChange: noteData = { time: 0, type: 0, length: 0, lane: 0, extra: 0 }
					for (let n of this.notes) {
						if ((n.type === noteTypes.BPM || n.type === noteTypes.BPM_FAKE) && n.time <= mouseTime) lastBPMChange = n
					}
					let tickDelta = (noteRender.bpmResolution * baseBPM) / lastBPMChange.extra
					let closestBeat = Math.round((mouseTime - lastBPMChange.time) / tickDelta) * tickDelta + lastBPMChange.time
	
					let data:noteData = {
						type:noteTypes.TAP_G,
						time:closestBeat,
						length:0,
						extra:0,
						lane:1,
					}

					if(this.noteClass === NoteClass.TAP){
						if(lane === -2 || lane === -1){
							//GREEN TAP
							let present = false
							for(let n of this.notes){
								if(n.type === noteTypes.TAP_G && n.time === closestBeat) {
									present = true
									break
								}
							}
							if(!present){
								data.type = noteTypes.TAP_G
								this.notes.push(data)
							}
						} else if(lane === 0){
							//RED TAP
							let present = false
							for(let n of this.notes){
								if(n.type === noteTypes.TAP_R && n.time === closestBeat) {
									present = true
									break
								}
							}
							if(!present){
								data.type = noteTypes.TAP_R
								this.notes.push(data)
							}
						} else if(lane === 1 || lane === 2){
							//BLUE TAP
							let present = false
							for(let n of this.notes){
								if(n.type === noteTypes.TAP_B && n.time === closestBeat) {
									present = true
									break
								}
							}
							if(!present){
								data.type = noteTypes.TAP_B
								this.notes.push(data)
							}
						}
					} else if(this.noteClass === NoteClass.SCRATCH){
						if(lane === -2 || lane === -1) {
							//GREEN
							let present = false
							for(let n of this.notes){
								if((n.type === noteTypes.SCR_G_UP || n.type === noteTypes.SCR_G_DOWN || n.type === noteTypes.SCR_G_ANYDIR) && n.time === closestBeat) {
									present = true
									break
								}
							}
							if(!present){
								if(this.selectedNote.type === noteTypes.SCR_G_UP) data.type = noteTypes.SCR_G_DOWN
								else data.type = noteTypes.SCR_G_UP

								this.notes.push(data)
							}
						} else if(lane === 1 || lane === 2){
							//BLUE
							let present = false
							for(let n of this.notes){
								if((n.type === noteTypes.SCR_B_UP || n.type === noteTypes.SCR_B_DOWN || n.type === noteTypes.SCR_B_ANYDIR) && n.time === closestBeat) {
									present = true
									break
								}
							}
							if(!present){
								if(this.selectedNote.type === noteTypes.SCR_B_UP) data.type = noteTypes.SCR_B_DOWN
								else data.type = noteTypes.SCR_B_UP

								this.notes.push(data)
							}
						}
					} else if(this.noteClass === NoteClass.CROSS){
						if(lane === -2 || lane === -1){
							//GREEN CROSS
							let present = false
							let toEdit:noteData = this.notes[0]
							for(let n of this.notes){
								if((n.type === noteTypes.CROSS_G || n.type === noteTypes.CROSS_C || n.type === noteTypes.CROSS_B) && n.time === closestBeat) {
									present = true
									toEdit = n
									break
								}
							}
							if(!present){
								data.type = noteTypes.CROSS_G
								this.notes.push(data)
							} else {
								toEdit.type = noteTypes.CROSS_G
							}
						} else if(lane === 0){
							//RED CROSS
							let present = false
							let toEdit:noteData = this.notes[0]
							for(let n of this.notes){
								if((n.type === noteTypes.CROSS_G || n.type === noteTypes.CROSS_C || n.type === noteTypes.CROSS_B) && n.time === closestBeat) {
									present = true
									toEdit = n
									break
								}
							}
							if(!present){
								data.type = noteTypes.CROSS_C
								this.notes.push(data)
							} else{
								toEdit.type = noteTypes.CROSS_C
							}
						} else if(lane === 1 || lane === 2){
							//BLUE CROSS
							let present = false
							let toEdit:noteData = this.notes[0]
							for(let n of this.notes){
								if((n.type === noteTypes.CROSS_G || n.type === noteTypes.CROSS_C || n.type === noteTypes.CROSS_B) && n.time === closestBeat) {
									present = true
									toEdit = n
									break
								}
							}
							if(!present){
								data.type = noteTypes.CROSS_B
								this.notes.push(data)
							} else {
								toEdit.type = noteTypes.CROSS_B
							}
						}
					} else if(this.noteClass === NoteClass.FX){
						if(lane === -2 || lane === -1){
							//GREEN FX
							let present = false
							for(let n of this.notes){
								if(n.type === noteTypes.FX_G && n.time === closestBeat) {
									present = true
									break
								}
							}
							if(!present){
								let fx:noteData = {
									type:noteTypes.FX_FILTER,
									time:data.time,
									lane:1,
									extra:0,
									length:0
								}

								data.type = noteTypes.FX_G
								this.notes.push(data)
								this.notes.push(fx)
							}
						} else if(lane === 0){
							//ALL FX
							let present = false
							for(let n of this.notes){
								if(n.type === noteTypes.FX_ALL && n.time === closestBeat) {
									present = true
									break
								}
							}
							if(!present){
								let fx:noteData = {
									type:noteTypes.FX_FILTER,
									time:data.time,
									lane:1,
									extra:0,
									length:0
								}

								data.type = noteTypes.FX_ALL
								this.notes.push(data)
								this.notes.push(fx)
							}
						} else if(lane === 1 || lane === 2){
							//BLUE FX
							let present = false
							for(let n of this.notes){
								if(n.type === noteTypes.FX_B && n.time === closestBeat) {
									present = true
									break
								}
							}
							if(!present){
								let fx:noteData = {
									type:noteTypes.FX_FILTER,
									time:data.time,
									lane:1,
									extra:0,
									length:0
								}
								data.type = noteTypes.FX_B
								this.notes.push(data)
								this.notes.push(fx)
							}
						}
					}
					
					this.notes.sort((a,b) => a.time - b.time)
					this.notes.forEach((n) => {
						n.lane = NoteLoader.getCrossAtTime(n.time,this.notes)
						n.selected = false
					})
					this.selectedNote = data
					this.selectedNote.selected = true
					this.needsRefreshing = true

					//console.log(this.notes.length)
				}
			}
		} else if(ev.type === "mousemove"){
			if(ev.which === 3){
				//holding down right button
				let mouseTime = this.getTimeFromY(ev,app,noteRender)

				let lastBPMChange: noteData = { time: 0, type: 0, length: 0, lane: 0, extra: 0 }
				for (let n of this.notes) {
					if ((n.type === noteTypes.BPM || n.type === noteTypes.BPM_FAKE) && n.time <= mouseTime) lastBPMChange = n
				}
				let tickDelta = (noteRender.bpmResolution * baseBPM) / lastBPMChange.extra
				let closestBeat = Math.round((mouseTime - lastBPMChange.time) / tickDelta) * tickDelta + lastBPMChange.time

				if(closestBeat >= this.selectedNote.time) {
					this.selectedNote.length = closestBeat - this.selectedNote.time
					if(this.selectedNote.type === noteTypes.FX_G || this.selectedNote.type === noteTypes.FX_ALL || this.selectedNote.type === noteTypes.FX_B){
						let possible = [noteTypes.REWIND, noteTypes.STRING, noteTypes.FX_FILTER, noteTypes.FX_BEATROLL, noteTypes.FX_BITREDUCTION, noteTypes.FX_WAHWAH, noteTypes.FX_RINGMOD, noteTypes.FX_STUTTER, noteTypes.FX_FLANGER, noteTypes.FX_ROBOT, noteTypes.FX_BEATROLLAUTO, noteTypes.FX_DELAY, noteTypes.BATTLE_MARKER]
						for(let n of this.notes){
							if(possible.includes(n.type) && n.time === this.selectedNote.time) n.length = closestBeat - this.selectedNote.time
						}
					}
				}
				this.needsRefreshing = true
			}
		} else if (ev.type === "mouseup") {
			if (this.mode === Modes.select) {
				let selectables: noteTypes[] = []

				let mouseTime = this.getTimeFromY(ev,app,noteRender)

				if (lane === -3) {
					//bpm
					selectables = [noteTypes.BPM, noteTypes.BPM_FAKE]
				} else if (lane === -2 || lane === -1) {
					//green
					if (this.noteClass == NoteClass.TAP) {
						selectables = [noteTypes.TAP_G]
					} else if (this.noteClass === NoteClass.SCRATCH) {
						selectables = [noteTypes.SCR_G_UP, noteTypes.SCR_G_DOWN, noteTypes.SCR_G_ANYDIR]
					} else if (this.noteClass === NoteClass.CROSS) {
						selectables = [noteTypes.CROSS_C, noteTypes.CROSS_G, noteTypes.CF_SPIKE_G, noteTypes.CF_SPIKE_C]
					} else if (this.noteClass === NoteClass.FX) {
						selectables = [noteTypes.FX_G, noteTypes.FX_ALL]
					} else if (this.noteClass === NoteClass.FS) {
						if (lane === -1) {
							selectables = [noteTypes.FS_CROSS]
						} else {
							selectables = [noteTypes.FS_CF_G_MARKER]
						}
					} else if (this.noteClass === NoteClass.EVENTS) {
						selectables = [noteTypes.EUPHORIA, noteTypes.SCR_G_ZONE]
					}
				} else if (lane === 0) {
					//red
					if (this.noteClass === NoteClass.TAP) {
						selectables = [noteTypes.TAP_R]
					} else if (this.noteClass === NoteClass.FS) {
						selectables = [noteTypes.FS_SAMPLES]
					} else if (this.noteClass === NoteClass.EVENTS) {
						selectables = [noteTypes.EUPHORIA]
					}
				} else if (lane === 1 || lane === 2) {
					//blue
					if (this.noteClass == NoteClass.TAP) {
						selectables = [noteTypes.TAP_B]
					} else if (this.noteClass === NoteClass.SCRATCH) {
						selectables = [noteTypes.SCR_B_UP, noteTypes.SCR_B_DOWN, noteTypes.SCR_B_ANYDIR]
					} else if (this.noteClass === NoteClass.CROSS) {
						selectables = [noteTypes.CROSS_C, noteTypes.CROSS_B, noteTypes.CF_SPIKE_B, noteTypes.CF_SPIKE_B]
					} else if (this.noteClass === NoteClass.FX) {
						selectables = [noteTypes.FX_B, noteTypes.FX_ALL]
					} else if (this.noteClass === NoteClass.FS) {
						if (lane === 1) {
							selectables = [noteTypes.FS_CROSS]
						} else {
							selectables = [noteTypes.FS_CF_B_MARKER]
						}
					} else if (this.noteClass === NoteClass.EVENTS) {
						selectables = [noteTypes.EUPHORIA, noteTypes.SCR_B_ZONE]
					}
				} else if (lane === 3) {
					//events
					if (this.noteClass === NoteClass.EVENTS) {
						selectables = [noteTypes.REWIND, noteTypes.STRING, noteTypes.FX_FILTER, noteTypes.FX_BEATROLL, noteTypes.FX_BITREDUCTION, noteTypes.FX_WAHWAH, noteTypes.FX_RINGMOD, noteTypes.FX_STUTTER, noteTypes.FX_FLANGER, noteTypes.FX_ROBOT, noteTypes.FX_BEATROLLAUTO, noteTypes.FX_DELAY, noteTypes.BATTLE_MARKER]
					}
				}

				let candidates: noteData[] = []

				for (let n of this.notes) {
					if (selectables.includes(n.type) && mouseTime > n.time - 0.0625 && mouseTime < n.time + n.length + 0.0625) {
						candidates.push(n)
					}
					n.selected = false
				}

				if (candidates.length > 0) {
					if (candidates.length === this.lastCandidates.length) {
						//scroll into the same noteData
						this.lastCandidateIndex = (this.lastCandidateIndex + 1) % candidates.length
						candidates[this.lastCandidateIndex].selected = true
						this.selectedNote = candidates[this.lastCandidateIndex]
					} else {
						//find closest match
						let bestIndex = 0

						for (let i = 0; i < candidates.length; ++i) {
							if (Math.abs(mouseTime - candidates[i].time) < Math.abs(mouseTime - candidates[bestIndex].time)) {
								bestIndex = i
							}
						}

						this.lastCandidateIndex = 0
						this.selectedNote = candidates[bestIndex]
						candidates[bestIndex].selected = true
					}
				}
				this.needsRefreshing = true

				this.lastCandidates = candidates
			}
		}
	}

	private getLane(ev: MouseEvent, app: PIXI.Application, uiScale: number) {
		let middle = app.renderer.width / 2

		if (ev.x < middle) {
			if (ev.x > middle - uiScale / 2) return 0
			else if (ev.x > middle - uiScale - uiScale / 2 && ev.x < middle - uiScale + uiScale / 2) return -1
			else if (ev.x > middle - 2 * uiScale - uiScale / 2 && ev.x < middle - 2 * uiScale + uiScale / 2) return -2
			else return -3
		} else {
			if (ev.x < middle + uiScale / 2) return 0
			else if (ev.x > middle + uiScale - uiScale / 2 && ev.x < middle + uiScale + uiScale / 2) return 1
			else if (ev.x > middle + 2 * uiScale - uiScale / 2 && ev.x < middle + 2 * uiScale + uiScale / 2) return 2
			else return 3
		}
	}

	setNoteClass(type: NoteClass) {
		this.noteClass = type
	}

	setMode(mode:Modes){
		this.mode = mode
	}

	private getTimeFromY(ev:MouseEvent,app:PIXI.Application,noteRender:NoteRender){
		const renderHeight = app.renderer.height - noteRender.clickerOffset
		return ((renderHeight - ev.y) / renderHeight) * noteRender.timeScale + noteRender.time
	}
}
