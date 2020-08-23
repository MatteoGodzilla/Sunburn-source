import * as PIXI from "pixi.js"
import { noteData, noteTypes } from "./CustomTypes"
import { NoteRender } from "./NoteRender"
import { NoteLoader } from "./NoteLoader"

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

const eventTypesList = [noteTypes.REWIND, noteTypes.STRING, noteTypes.FX_FILTER, noteTypes.FX_BEATROLL, noteTypes.FX_BITREDUCTION, noteTypes.FX_WAHWAH, noteTypes.FX_RINGMOD, noteTypes.FX_STUTTER, noteTypes.FX_FLANGER, noteTypes.FX_ROBOT, noteTypes.FX_BEATROLLAUTO, noteTypes.FX_DELAY, noteTypes.BATTLE_MARKER]

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

	mouseHandler(ev: MouseEvent, app: PIXI.Application, noteRender: NoteRender, baseBPM: number) {
		let lane = this.getLane(ev, app, noteRender.uiScale)

		if (ev.type === "mousedown") {
			let mouseTime = this.getTimeFromY(ev, app, noteRender)

			let lastBPMChange: noteData = { time: 0, type: 0, length: 0, lane: 0, extra: 0 }
			for (let n of this.notes) {
				if ((n.type === noteTypes.BPM || n.type === noteTypes.BPM_FAKE) && n.time <= mouseTime) lastBPMChange = n
			}
			let tickDelta = (noteRender.bpmResolution * baseBPM) / lastBPMChange.extra
			let closestBeat = Math.round((mouseTime - lastBPMChange.time) / tickDelta) * tickDelta + lastBPMChange.time

			if (this.mode === Modes.add) {
				let data: noteData = {
					type: noteTypes.TAP_G,
					time: closestBeat,
					length: 0,
					extra: 0,
					lane: 1
				}

				if (this.noteClass === NoteClass.TAP) {
					if ((lane === -2 || lane === -1) && ev.which === 1) {
						//GREEN TAP
						let present = false
						for (let n of this.notes) {
							if (n.type === noteTypes.TAP_G && n.time === closestBeat) {
								present = true
								break
							}
						}
						if (!present) {
							data.type = noteTypes.TAP_G
							this.notes.push(data)
						}
					} else if (lane === 0 && ev.which === 1) {
						//RED TAP
						let present = false
						for (let n of this.notes) {
							if (n.type === noteTypes.TAP_R && n.time === closestBeat) {
								present = true
								break
							}
						}
						if (!present) {
							data.type = noteTypes.TAP_R
							this.notes.push(data)
						}
					} else if ((lane === 1 || lane === 2) && ev.which === 1) {
						//BLUE TAP
						let present = false
						for (let n of this.notes) {
							if (n.type === noteTypes.TAP_B && n.time === closestBeat) {
								present = true
								break
							}
						}
						if (!present) {
							data.type = noteTypes.TAP_B
							this.notes.push(data)
						}
					}
				} else if (this.noteClass === NoteClass.SCRATCH) {
					if (lane === -2 || lane === -1) {
						//GREEN
						let present = false
						for (let n of this.notes) {
							if ((n.type === noteTypes.SCR_G_UP || n.type === noteTypes.SCR_G_DOWN || n.type === noteTypes.SCR_G_ANYDIR) && n.time === closestBeat) {
								present = true
								break
							}
						}
						if (!present) {
							if (ev.which === 1) data.type = noteTypes.SCR_G_UP
							else if (ev.which === 3) data.type = noteTypes.SCR_G_DOWN

							this.notes.push(data)
						}
					} else if (lane === 1 || lane === 2) {
						//BLUE
						let present = false
						for (let n of this.notes) {
							if ((n.type === noteTypes.SCR_B_UP || n.type === noteTypes.SCR_B_DOWN || n.type === noteTypes.SCR_B_ANYDIR) && n.time === closestBeat) {
								present = true
								break
							}
						}
						if (!present) {
							if (ev.which === 1) data.type = noteTypes.SCR_B_UP
							else if (ev.which === 3) data.type = noteTypes.SCR_B_DOWN

							this.notes.push(data)
						}
					}
				} else if (this.noteClass === NoteClass.CROSS) {
					if (lane === -2 || lane === -1) {
						//GREEN CROSS
						if (ev.which === 1) {
							let present = false
							let toEdit: noteData = this.notes[0]
							for (let n of this.notes) {
								if ((n.type === noteTypes.CROSS_G || n.type === noteTypes.CROSS_C || n.type === noteTypes.CROSS_B) && n.time === closestBeat) {
									present = true
									toEdit = n
									break
								}
							}
							if (!present) {
								data.type = noteTypes.CROSS_G
								this.notes.push(data)
							} else {
								toEdit.type = noteTypes.CROSS_G
							}
						} else if (ev.which === 3) {
							let present = false
							let toEdit: noteData = this.notes[0]
							for (let n of this.notes) {
								if ((n.type === noteTypes.CF_SPIKE_G || n.type === noteTypes.CF_SPIKE_B || n.type === noteTypes.CF_SPIKE_C) && n.time === closestBeat) {
									present = true
									toEdit = n
									break
								}
							}
							if (!present) {
								data.type = noteTypes.CF_SPIKE_G
								this.notes.push(data)
							} else {
								toEdit.type = noteTypes.CF_SPIKE_G
							}
						}
					} else if (lane === 0) {
						//RED CROSS
						if (ev.which === 1) {
							let present = false
							let toEdit: noteData = this.notes[0]
							for (let n of this.notes) {
								if ((n.type === noteTypes.CROSS_G || n.type === noteTypes.CROSS_C || n.type === noteTypes.CROSS_B) && n.time === closestBeat) {
									present = true
									toEdit = n
									break
								}
							}
							if (!present) {
								data.type = noteTypes.CROSS_C
								this.notes.push(data)
							} else {
								toEdit.type = noteTypes.CROSS_C
							}
						} else if (ev.which === 3) {
							let present = false
							let toEdit: noteData = this.notes[0]
							for (let n of this.notes) {
								if ((n.type === noteTypes.CF_SPIKE_G || n.type === noteTypes.CF_SPIKE_B || n.type === noteTypes.CF_SPIKE_C) && n.time === closestBeat) {
									present = true
									toEdit = n
									break
								}
							}
							if (!present) {
								data.type = noteTypes.CF_SPIKE_C
								this.notes.push(data)
							} else {
								toEdit.type = noteTypes.CF_SPIKE_C
							}
						}
					} else if (lane === 1 || lane === 2) {
						//BLUE CROSS
						if (ev.which === 1) {
							let present = false
							let toEdit: noteData = this.notes[0]
							for (let n of this.notes) {
								if ((n.type === noteTypes.CROSS_G || n.type === noteTypes.CROSS_C || n.type === noteTypes.CROSS_B) && n.time === closestBeat) {
									present = true
									toEdit = n
									break
								}
							}
							if (!present) {
								data.type = noteTypes.CROSS_B
								this.notes.push(data)
							} else {
								toEdit.type = noteTypes.CROSS_B
							}
						} else if (ev.which === 3) {
							let present = false
							let toEdit: noteData = this.notes[0]
							for (let n of this.notes) {
								if ((n.type === noteTypes.CF_SPIKE_G || n.type === noteTypes.CF_SPIKE_B || n.type === noteTypes.CF_SPIKE_C) && n.time === closestBeat) {
									present = true
									toEdit = n
									break
								}
							}
							if (!present) {
								data.type = noteTypes.CF_SPIKE_B
								this.notes.push(data)
							} else {
								toEdit.type = noteTypes.CF_SPIKE_B
							}
						}
					}
				} else if (this.noteClass === NoteClass.FX) {
					if ((lane === -2 || lane === -1) && ev.which === 1) {
						//GREEN FX
						let present = false
						for (let n of this.notes) {
							if (n.type === noteTypes.FX_G && n.time === closestBeat) {
								present = true
								break
							}
						}
						if (!present) {
							let fx: noteData = {
								type: noteTypes.FX_FILTER,
								time: data.time,
								lane: 1,
								extra: 0,
								length: 0
							}

							data.type = noteTypes.FX_G
							this.notes.push(data)
							this.notes.push(fx)
						}
					} else if (lane === 0 && ev.which === 1) {
						//ALL FX
						let present = false
						for (let n of this.notes) {
							if (n.type === noteTypes.FX_ALL && n.time === closestBeat) {
								present = true
								break
							}
						}
						if (!present) {
							let fx: noteData = {
								type: noteTypes.FX_FILTER,
								time: data.time,
								lane: 1,
								extra: 0,
								length: 0
							}

							data.type = noteTypes.FX_ALL
							this.notes.push(data)
							this.notes.push(fx)
						}
					} else if ((lane === 1 || lane === 2) && ev.which === 1) {
						//BLUE FX
						let present = false
						for (let n of this.notes) {
							if (n.type === noteTypes.FX_B && n.time === closestBeat) {
								present = true
								break
							}
						}
						if (!present) {
							let fx: noteData = {
								type: noteTypes.FX_FILTER,
								time: data.time,
								lane: 1,
								extra: 0,
								length: 0
							}
							data.type = noteTypes.FX_B
							this.notes.push(data)
							this.notes.push(fx)
						}
					}
				} else if (this.noteClass === NoteClass.FS) {
					if (lane === -2 || lane === -1) {
						//green lane
						if (ev.which === 1) {
							//FREESTYLE CROSSFADE
							let present = false
							for (let n of this.notes) {
								if (n.type === noteTypes.FS_CROSS && n.time === closestBeat) {
									present = true
									break
								}
							}
							if (!present) {
								data.type = noteTypes.FS_CROSS
								this.notes.push(data)
							}
						} else if (ev.which === 3) {
							//GREEN MARKER
							let present = false
							for (let n of this.notes) {
								if (n.type === noteTypes.FS_CF_G_MARKER && n.time === closestBeat) {
									present = true
									break
								}
							}
							if (!present) {
								data.type = noteTypes.FS_CF_G_MARKER
								this.notes.push(data)
							}
						}
					} else if (lane === 0) {
						//red lane
						if (ev.which === 1) {
							//FREESTYLE SAMPLES
							let present = false
							for (let n of this.notes) {
								if (n.type === noteTypes.FS_SAMPLES && n.time === closestBeat) {
									present = true
									break
								}
							}
							if (!present) {
								data.type = noteTypes.FS_SAMPLES
								this.notes.push(data)
							}
						}
					} else if (lane === 1 || lane === 2) {
						//blue lane
						if (ev.which === 1) {
							//FREESTYLE CROSSFADE
							let present = false
							for (let n of this.notes) {
								if (n.type === noteTypes.FS_CROSS && n.time === closestBeat) {
									present = true
									break
								}
							}
							if (!present) {
								data.type = noteTypes.FS_CROSS
								this.notes.push(data)
							}
						} else if (ev.which === 3) {
							//BLUE MARKER
							let present = false
							for (let n of this.notes) {
								if (n.type === noteTypes.FS_CF_B_MARKER && n.time === closestBeat) {
									present = true
									break
								}
							}
							if (!present) {
								data.type = noteTypes.FS_CF_B_MARKER
								this.notes.push(data)
							}
						}
					}
				} else if (this.noteClass === NoteClass.EVENTS) {
					if (ev.which === 1) {
						data.type = noteTypes.REWIND
						this.notes.push(data)
					}
				}

				this.notes.sort((a, b) => a.time - b.time)
				this.notes.forEach((n) => {
					n.lane = NoteLoader.getCrossAtTime(n.time, this.notes)
					n.selected = false
				})
				this.selectedNote = data
				this.selectedNote.selected = true
				this.needsRefreshing = true

				//console.log(this.notes.length)
			} else if (this.mode === Modes.delete) {
				if (this.noteClass === NoteClass.TAP) {
					if ((lane === -2 || lane === -1) && ev.which === 1) {
						//GREEN TAP
						for (let n of this.notes) {
							if (n.type === noteTypes.TAP_G && n.time <= closestBeat && closestBeat <= n.time + n.length) {
								this.notes.splice(this.notes.indexOf(n), 1)
								break
							}
						}
					} else if (lane === 0 && ev.which === 1) {
						//RED TAP
						for (let n of this.notes) {
							if (n.type === noteTypes.TAP_R && n.time <= closestBeat && closestBeat <= n.time + n.length) {
								this.notes.splice(this.notes.indexOf(n), 1)
								break
							}
						}
					} else if ((lane === 1 || lane === 2) && ev.which === 1) {
						//BLUE TAP
						for (let n of this.notes) {
							if (n.type === noteTypes.TAP_B && n.time <= closestBeat && closestBeat <= n.time + n.length) {
								this.notes.splice(this.notes.indexOf(n), 1)
								break
							}
						}
					}
				} else if (this.noteClass === NoteClass.SCRATCH) {
					if (lane === -2 || lane === -1) {
						//GREEN
						for (let n of this.notes) {
							if ((n.type === noteTypes.SCR_G_UP || n.type === noteTypes.SCR_G_DOWN || n.type === noteTypes.SCR_G_ANYDIR) && n.time === closestBeat) {
								this.notes.splice(this.notes.indexOf(n), 1)
								break
							}
						}
					} else if (lane === 1 || lane === 2) {
						//BLUE
						for (let n of this.notes) {
							if ((n.type === noteTypes.SCR_B_UP || n.type === noteTypes.SCR_B_DOWN || n.type === noteTypes.SCR_B_ANYDIR) && n.time === closestBeat) {
								this.notes.splice(this.notes.indexOf(n), 1)
								break
							}
						}
					}
				} else if (this.noteClass === NoteClass.CROSS) {
					if ((lane === -2 || lane === -1) && ev.which === 1) {
						//GREEN CROSS
						for (let n of this.notes) {
							if (n.type === noteTypes.CROSS_G && n.time <= closestBeat && closestBeat <= n.time + n.length) {
								this.notes.splice(this.notes.indexOf(n), 1)
								break
							}
						}
					} else if (lane === 0 && ev.which === 1) {
						//RED CROSS
						for (let n of this.notes) {
							if (n.type === noteTypes.CROSS_C && n.time <= closestBeat && closestBeat <= n.time + n.length) {
								this.notes.splice(this.notes.indexOf(n), 1)
								break
							}
						}
					} else if ((lane === 1 || lane === 2) && ev.which === 1) {
						//BLUE CROSS
						for (let n of this.notes) {
							if (n.type === noteTypes.CROSS_B && n.time <= closestBeat && closestBeat <= n.time + n.length) {
								this.notes.splice(this.notes.indexOf(n), 1)
								break
							}
						}
					}
				} else if (this.noteClass === NoteClass.FX) {
					if ((lane === -2 || lane === -1) && ev.which === 1) {
						//GREEN FX
						for (let n of this.notes) {
							if (n.type === noteTypes.FX_G && n.time <= closestBeat && closestBeat <= n.time + n.length) {
								this.notes.splice(this.notes.indexOf(n), 1)
								break
							}
						}
					} else if (lane === 0 && ev.which === 1) {
						//ALL FX
						for (let n of this.notes) {
							if (n.type === noteTypes.FX_ALL && n.time <= closestBeat && closestBeat <= n.time + n.length) {
								this.notes.splice(this.notes.indexOf(n), 1)
								break
							}
						}
					} else if ((lane === 1 || lane === 2) && ev.which === 1) {
						//BLUE FX
						for (let n of this.notes) {
							if (n.type === noteTypes.FX_B && n.time <= closestBeat && closestBeat <= n.time + n.length) {
								this.notes.splice(this.notes.indexOf(n), 1)
								break
							}
						}
					}
				} else if (this.noteClass === NoteClass.FS) {
					if (lane === -2 && ev.which === 1) {
						for (let n of this.notes) {
							if (n.type === noteTypes.FS_CF_G_MARKER && n.time <= closestBeat && closestBeat <= n.time + n.length) {
								this.notes.splice(this.notes.indexOf(n), 1)
								break
							}
						}
					} else if ((lane === -1 || lane === 1) && ev.which === 1) {
						for (let n of this.notes) {
							if (n.type === noteTypes.FS_CROSS && n.time <= closestBeat && closestBeat <= n.time + n.length) {
								this.notes.splice(this.notes.indexOf(n), 1)
								break
							}
						}
					} else if (lane === 0 && ev.which === 1) {
						for (let n of this.notes) {
							if (n.type === noteTypes.FS_SAMPLES && n.time <= closestBeat && closestBeat <= n.time + n.length) {
								break
							}
						}
					} else if (lane === 2 && ev.which === 1) {
						for (let n of this.notes) {
							if (n.type === noteTypes.FS_CF_B_MARKER && n.time <= closestBeat && closestBeat <= n.time + n.length) {
								this.notes.splice(this.notes.indexOf(n), 1)
								break
							}
						}
					}
				} else if (this.noteClass === NoteClass.EVENTS) {
					if (lane === -3) {
						for (let n of this.notes) {
							if ((n.type === noteTypes.BPM || n.type === noteTypes.BPM_FAKE) && n.time <= closestBeat && closestBeat <= n.time + n.length) {
								this.notes.splice(this.notes.indexOf(n), 1)
								break
							}
						}
					} else if (lane === 3) {
						for (let n of this.notes) {
							if (eventTypesList.includes(n.type) && n.time <= closestBeat && closestBeat <= n.time + n.length) {
								this.notes.splice(this.notes.indexOf(n), 1)
								break
							}
						}
					}
				}

				this.notes.sort((a, b) => a.time - b.time)
				this.notes.forEach((n) => {
					n.lane = NoteLoader.getCrossAtTime(n.time, this.notes)
					n.selected = false
				})
				this.needsRefreshing = true

				//console.log(this.notes.length)
			}
		} else if (ev.type === "mousemove") {
			if (ev.which === 3) {
				//holding down right button
				let mouseTime = this.getTimeFromY(ev, app, noteRender)

				let lastBPMChange: noteData = { time: 0, type: 0, length: 0, lane: 0, extra: 0 }
				for (let n of this.notes) {
					if ((n.type === noteTypes.BPM || n.type === noteTypes.BPM_FAKE) && n.time <= mouseTime) lastBPMChange = n
				}
				let tickDelta = (noteRender.bpmResolution * baseBPM) / lastBPMChange.extra
				let closestBeat = Math.round((mouseTime - lastBPMChange.time) / tickDelta) * tickDelta + lastBPMChange.time

				if (closestBeat >= this.selectedNote.time) {
					this.selectedNote.length = closestBeat - this.selectedNote.time
					if (this.selectedNote.type === noteTypes.FX_G || this.selectedNote.type === noteTypes.FX_ALL || this.selectedNote.type === noteTypes.FX_B) {
						let possible = [noteTypes.REWIND, noteTypes.STRING, noteTypes.FX_FILTER, noteTypes.FX_BEATROLL, noteTypes.FX_BITREDUCTION, noteTypes.FX_WAHWAH, noteTypes.FX_RINGMOD, noteTypes.FX_STUTTER, noteTypes.FX_FLANGER, noteTypes.FX_ROBOT, noteTypes.FX_BEATROLLAUTO, noteTypes.FX_DELAY, noteTypes.BATTLE_MARKER]
						for (let n of this.notes) {
							if (possible.includes(n.type) && n.time === this.selectedNote.time) n.length = closestBeat - this.selectedNote.time
						}
					}
				}
				this.needsRefreshing = true
			}
		} else if (ev.type === "mouseup") {
			if (this.mode === Modes.select) {
				let selectables: noteTypes[] = []

				let mouseTime = this.getTimeFromY(ev, app, noteRender)

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
						selectables = eventTypesList
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

	keyHandler(ev: KeyboardEvent, app: PIXI.Application, noteRender: NoteRender, baseBPM: number) {
		if (ev.key === "a") {
			this.mode = Modes.add
			this.needsRefreshing = true
		} else if (ev.key === "s") {
			this.mode = Modes.select
			this.needsRefreshing = true
		} else if (ev.key === "d") {
			this.mode = Modes.delete
			this.needsRefreshing = true
		} else if (ev.key === "1") {
			this.noteClass = NoteClass.TAP
			this.needsRefreshing = true
		} else if (ev.key === "2") {
			this.noteClass = NoteClass.SCRATCH
			this.needsRefreshing = true
		} else if (ev.key === "3") {
			this.noteClass = NoteClass.CROSS
			this.needsRefreshing = true
		} else if (ev.key === "q") {
			this.noteClass = NoteClass.FX
			this.needsRefreshing = true
		} else if (ev.key === "w") {
			this.noteClass = NoteClass.FS
			this.needsRefreshing = true
		} else if (ev.key === "e") {
			this.noteClass = NoteClass.EVENTS
			this.needsRefreshing = true
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

	setMode(mode: Modes) {
		this.mode = mode
	}

	private getTimeFromY(ev: MouseEvent, app: PIXI.Application, noteRender: NoteRender) {
		const renderHeight = app.renderer.height - noteRender.clickerOffset
		return ((renderHeight - ev.y) / renderHeight) * noteRender.timeScale + noteRender.time
	}
}
