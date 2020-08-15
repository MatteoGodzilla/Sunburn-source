import { noteData, noteTypes } from "./CustomTypes"
import * as PIXI from "pixi.js"
import { NoteLoader } from "./NoteLoader"

enum texID {
	TAP_G = "res/green note.png",
	TAP_R = "res/red note.png",
	TAP_B = "res/blue note.png",
	SCR_UP = "res/up.png",
	SCR_DOWN = "res/down.png",
	SCR_ANYDIR = "res/anydir.png",
	CF_SPIKE_GREEN = "res/cf-spike-green.png",
	CF_SPIKE_BLUE = "res/cf-spike-blue.png",
	CLICKER_G = "res/clicker green.png",
	CLICKER_R = "res/clicker red.png",
	CLICKER_B = "res/clicker blue.png",
	CLICKER_BASE = "res/clickerSideBase.png"
}

let textures: string[] = []

for (let v in texID) {
	textures.push(texID[v])
}

interface grObject {
	sprite: PIXI.Sprite
	graphic: PIXI.Graphics
}

export class NoteRender {
	private container: PIXI.Container
	private bpmContainer: PIXI.Container
	time = 0
	uiScale = 100
	timeScale = 100
	clickerOffset = 100
	private crossPosition = 1

	private clickerBaseLeft = new PIXI.Sprite()
	private clickerBaseRight = new PIXI.Sprite()
	private clickerGreen = new PIXI.Sprite()
	private clickerRed = new PIXI.Sprite()
	private clickerBlue = new PIXI.Sprite()

	private redGraphic = new PIXI.Graphics()
	private greenGraphic = new PIXI.Graphics()
	private blueGraphic = new PIXI.Graphics()

	private sprites: {
		objects: grObject[]
		usedCount: number
	}[] = []

	private events: {
		base: PIXI.Graphics
		text: PIXI.Text
		length: PIXI.Graphics
	}[] = []

	private eventRenderCount = 0

	private readonly lineWidth = 16

	constructor(app: PIXI.Application) {
		this.container = new PIXI.Container()
		this.bpmContainer = new PIXI.Container()
		app.stage.addChild(this.bpmContainer)
		app.stage.addChild(this.container)

		PIXI.Loader.shared.add(textures).load((loader) => {
			console.log("Loaded textures")
			const renderHeight = app.renderer.height - this.clickerOffset

			this.clickerBaseLeft = new PIXI.Sprite(loader.resources[texID.CLICKER_BASE].texture)
			this.clickerBaseLeft.width = this.uiScale * 2
			this.clickerBaseLeft.height = this.uiScale
			this.clickerBaseLeft.anchor.set(0.75, 0.5)
			this.container.addChild(this.clickerBaseLeft)

			this.clickerBaseRight = new PIXI.Sprite(loader.resources[texID.CLICKER_BASE].texture)
			this.clickerBaseRight.width = this.uiScale * 2
			this.clickerBaseRight.height = this.uiScale
			this.clickerBaseRight.anchor.set(0.25, 0.5)
			this.container.addChild(this.clickerBaseRight)

			this.clickerGreen = new PIXI.Sprite(loader.resources[texID.CLICKER_G].texture)
			this.clickerGreen.width = this.uiScale
			this.clickerGreen.height = this.uiScale
			this.clickerGreen.anchor.set(0.5, 0.5)
			this.container.addChild(this.clickerGreen)

			this.clickerRed = new PIXI.Sprite(loader.resources[texID.CLICKER_R].texture)
			this.clickerRed.width = this.uiScale
			this.clickerRed.height = this.uiScale
			this.clickerRed.anchor.set(0.5, 0.5)
			this.container.addChild(this.clickerRed)

			this.clickerBlue = new PIXI.Sprite(loader.resources[texID.CLICKER_B].texture)
			this.clickerBlue.width = this.uiScale
			this.clickerBlue.height = this.uiScale
			this.clickerBlue.anchor.set(0.5, 0.5)
			this.container.addChild(this.clickerBlue)

			let redLanePoints = []

			redLanePoints.push(new PIXI.Point(0, 0))
			redLanePoints.push(new PIXI.Point(0, -renderHeight))

			this.redGraphic = new PIXI.Graphics()
			this.redGraphic.lineStyle(this.lineWidth, 0xff0000)
			redLanePoints.forEach((point) => {
				this.redGraphic.lineTo(point.x, point.y)
			})
			this.container.addChild(this.redGraphic)

			this.greenGraphic = new PIXI.Graphics()
			this.greenGraphic.lineStyle(this.lineWidth, 0x00ff00)
			this.container.addChild(this.greenGraphic)

			this.blueGraphic = new PIXI.Graphics()
			this.blueGraphic.lineStyle(this.lineWidth, 0x00ff00)
			this.container.addChild(this.blueGraphic)
		})

		/*
		let test = new PIXI.Text("ASDFASDF",new PIXI.TextStyle({fill:0xffffff}))
		test.position.set(0,500)
		test.text = "CHANGED"
		this.container.addChild(test)
		*/
	}

	draw(app: PIXI.Application, arr: noteData[]) {
		this.crossPosition = NoteLoader.getCrossAtTime(this.time, arr)
		const renderHeight = app.renderer.height - this.clickerOffset

		this.clickerBaseLeft.position.set(app.renderer.width / 2 - this.clickerBaseLeft.width / 2, renderHeight)

		this.clickerBaseRight.position.set(app.renderer.width / 2 + this.clickerBaseLeft.width / 2, renderHeight)

		this.clickerRed.position.set(app.renderer.width / 2, renderHeight)

		if (this.crossPosition == 0) {
			this.clickerGreen.position.set(app.renderer.width / 2 - 2 * this.clickerGreen.width, renderHeight)
			this.clickerBlue.position.set(app.renderer.width / 2 + this.clickerBlue.width, renderHeight)
		} else if (this.crossPosition == 1) {
			this.clickerGreen.position.set(app.renderer.width / 2 - this.clickerGreen.width, renderHeight)
			this.clickerBlue.position.set(app.renderer.width / 2 + this.clickerBlue.width, renderHeight)
		} else {
			this.clickerGreen.position.set(app.renderer.width / 2 - this.clickerGreen.width, renderHeight)
			this.clickerBlue.position.set(app.renderer.width / 2 + 2 * this.clickerBlue.width, renderHeight)
		}

		this.redGraphic.position.set(app.renderer.width / 2, renderHeight)

		let greenLanePoints = []
		let blueLanePoints = []

		this.greenGraphic.clear()
		this.blueGraphic.clear()

		for (let y = 0; y < renderHeight; y++) {
			let t = this.time + this.timeScale * (y / renderHeight)
			let pos = NoteLoader.getCrossAtTime(t, arr)

			if (pos == 0) {
				greenLanePoints.push(new PIXI.Point(app.renderer.width / 2 - 2 * this.clickerGreen.width, renderHeight - y))
				blueLanePoints.push(new PIXI.Point(app.renderer.width / 2 + this.clickerBlue.width, renderHeight - y))
			} else if (pos == 1) {
				greenLanePoints.push(new PIXI.Point(app.renderer.width / 2 - this.clickerGreen.width, renderHeight - y))
				blueLanePoints.push(new PIXI.Point(app.renderer.width / 2 + this.clickerBlue.width, renderHeight - y))
			} else if (pos == 2) {
				greenLanePoints.push(new PIXI.Point(app.renderer.width / 2 - this.clickerGreen.width, renderHeight - y))
				blueLanePoints.push(new PIXI.Point(app.renderer.width / 2 + 2 * this.clickerBlue.width, renderHeight - y))
			}
		}

		let lastGreenPoint = new PIXI.Point(0, 0)
		if (this.crossPosition == 0) {
			lastGreenPoint = new PIXI.Point(app.renderer.width / 2 - 2 * this.clickerGreen.width, renderHeight)
			this.greenGraphic.moveTo(lastGreenPoint.x, lastGreenPoint.y)
		} else {
			lastGreenPoint = new PIXI.Point(app.renderer.width / 2 - this.clickerGreen.width, renderHeight)
			this.greenGraphic.moveTo(lastGreenPoint.x, lastGreenPoint.y)
		}
		greenLanePoints.forEach((point) => {
			if (point.x != lastGreenPoint.x) {
				this.greenGraphic.lineTo(lastGreenPoint.x, point.y)
			}
			this.greenGraphic.lineStyle(this.lineWidth, 0x00ff00)
			this.greenGraphic.lineTo(point.x, point.y)
			lastGreenPoint = point
		})

		let lastBluePoint = new PIXI.Point(0, 0)

		if (this.crossPosition == 2) {
			lastBluePoint = new PIXI.Point(app.renderer.width / 2 + 2 * this.clickerGreen.width, renderHeight)
			this.blueGraphic.moveTo(lastBluePoint.x, lastBluePoint.y)
		} else {
			lastBluePoint = new PIXI.Point(app.renderer.width / 2 + this.clickerGreen.width, renderHeight)
			this.blueGraphic.moveTo(lastBluePoint.x, lastBluePoint.y)
		}
		blueLanePoints.forEach((point) => {
			if (point.x != lastBluePoint.x) {
				this.blueGraphic.lineTo(lastBluePoint.x, point.y)
			}
			this.blueGraphic.lineStyle(this.lineWidth, 0x0000ff)
			this.blueGraphic.lineTo(point.x, point.y)
			lastBluePoint = point
		})

		this.resetSprites()
		this.resetEvents()

		for (let i = arr.length - 1; i >= 0; i--) {
			const note = arr[i]
			if (note.time < this.time + this.timeScale && ((note.length <= 0.0625 && note.time >= this.time) || (note.length > 0.0625 && note.time + note.length >= this.time))) {
				let x = app.renderer.width / 2
				let y = renderHeight - ((note.time - this.time) / this.timeScale) * renderHeight

				y = y > renderHeight ? renderHeight : y

				let graphicsObject: grObject | undefined = undefined

				if (note.type === noteTypes.TAP_G || note.type === noteTypes.SCR_G_UP || note.type === noteTypes.SCR_G_DOWN || note.type === noteTypes.SCR_G_ANYDIR) {
					x -= (note.lane == 0 ? 2 : 1) * this.uiScale
					graphicsObject = this.getSprite(note.type)
					graphicsObject.sprite.position.set(x, y)
					if (note.length > 0.0625) {
						//add tail
						let width = 40
						let startHeight = renderHeight - ((note.time + note.length - this.time) / this.timeScale) * renderHeight

						graphicsObject.graphic.beginFill(0xffffff, 0.5)
						graphicsObject.graphic.drawRect(x - width / 2, startHeight, width, y - startHeight)
					}
				} else if (note.type === noteTypes.TAP_R) {
					graphicsObject = this.getSprite(note.type)
					graphicsObject.sprite.position.set(x, y)
					if (note.length > 0.0625) {
						//add tail
						let width = 40
						let startHeight = renderHeight - ((note.time + note.length - this.time) / this.timeScale) * renderHeight

						graphicsObject.graphic.beginFill(0xffffff, 0.5)
						graphicsObject.graphic.drawRect(x - width / 2, startHeight, width, y - startHeight)
					}
				} else if (note.type === noteTypes.TAP_B || note.type === noteTypes.SCR_B_UP || note.type === noteTypes.SCR_B_DOWN || note.type === noteTypes.SCR_B_ANYDIR) {
					x += (note.lane == 2 ? 2 : 1) * this.uiScale
					graphicsObject = this.getSprite(note.type)
					graphicsObject.sprite.position.set(x, y)
					if (note.length > 0.0625) {
						//add tail
						let width = 40
						let startHeight = renderHeight - ((note.time + note.length - this.time) / this.timeScale) * renderHeight

						graphicsObject.graphic.beginFill(0xffffff, 0.5)
						graphicsObject.graphic.drawRect(x - width / 2, startHeight, width, y - startHeight)
					}
				} else if (note.type == noteTypes.CF_SPIKE_G) {
					x -= this.uiScale * 1.5
					graphicsObject = this.getSprite(note.type)
					graphicsObject.sprite.position.set(x, y)
					graphicsObject.sprite.height = this.uiScale / 2
					if (NoteLoader.getCrossAtTime(note.time, arr) == 2) {
						x += this.uiScale * 3
						let s = this.getSprite(noteTypes.CF_SPIKE_B)
						s.sprite.position.set(x, y)
						s.sprite.height = this.uiScale / 2
						s.sprite.scale.x = -1 * s.sprite.scale.x
					}
				} else if (note.type === noteTypes.CF_SPIKE_B) {
					x += this.uiScale * 1.5
					graphicsObject = this.getSprite(note.type)
					graphicsObject.sprite.height = this.uiScale / 2
					graphicsObject.sprite.position.set(x, y)
					if (NoteLoader.getCrossAtTime(note.time, arr) == 0) {
						x -= this.uiScale * 3
						let s = this.getSprite(noteTypes.CF_SPIKE_G)
						s.sprite.position.set(x, y)
						s.sprite.height = this.uiScale / 2
						s.sprite.scale.x = -1 * s.sprite.scale.x
					}
				} else if (note.type === noteTypes.CF_SPIKE_C) {
					if (NoteLoader.getCrossAtTime(note.time, arr) == 0) {
						x -= this.uiScale * 1.5
						graphicsObject = this.getSprite(note.type)
						graphicsObject.sprite.height = this.uiScale / 2
						graphicsObject.sprite.position.set(x, y)
						graphicsObject.sprite.scale.x = -1 * graphicsObject.sprite.scale.x
					} else if (NoteLoader.getCrossAtTime(note.time, arr) == 2) {
						x += this.uiScale * 1.5
						graphicsObject = this.getSprite(noteTypes.CF_SPIKE_B)
						graphicsObject.sprite.height = this.uiScale / 2
						graphicsObject.sprite.position.set(x, y)
						graphicsObject.sprite.scale.x = -1 * graphicsObject.sprite.scale.x
					}
				} else if (note.type === noteTypes.BPM || note.type === noteTypes.BPM_FAKE) {
					let ev = this.getEvent()
					x -= this.uiScale * 4

					//let lengthY = renderHeight - ((note.time + note.length - this.time) / this.timeScale) * renderHeight

					if (this.eventRenderCount >= 2) {
						for (let i = 0; i < this.eventRenderCount - 1; ++i) {
							let after = this.events[i]
							let afterHeight = after.base.y + after.base.height / 2
							if (y === afterHeight && after.base.x < app.renderer.width / 2) {
								this.events[i].base.x -= this.uiScale
								this.events[i].length.x -= this.uiScale
								this.events[i].text.x -= this.uiScale
							}
						}
					}

					ev.base.position.set(x, y - ev.base.height / 2)

					//ev.length.position.set(x - (this.uiScale - ev.base.height) / 2, lengthY)
					//ev.length.height = y - lengthY

					let text = note.extra.toFixed(4)
					/* for(let value in noteTypes){
						if(Number(value) && value === note.type.toString()) text = noteTypes[value]
					} */
					ev.text.text = text
					ev.text.position.set(x + this.uiScale / 2, y)
				} else if (note.type !== noteTypes.CROSS_G && note.type !== noteTypes.CROSS_B && note.type !== noteTypes.CROSS_C) {
					let ev = this.getEvent()
					x += this.uiScale * 3

					let lengthYPos = renderHeight - ((note.time + note.length - this.time) / this.timeScale) * renderHeight

					if (this.eventRenderCount >= 2) {
						for (let i = 0; i < this.eventRenderCount - 1; ++i) {
							let after = this.events[i]
							let afterHeight = after.base.y + after.base.height / 2
							if (y >= afterHeight && lengthYPos < afterHeight && after.base.x > app.renderer.width / 2) {
								this.events[i].base.x += this.uiScale
								this.events[i].length.x += this.uiScale
								this.events[i].text.x += this.uiScale
							}
						}
					}

					ev.base.position.set(x, y - ev.base.height / 2)

					ev.length.position.set(x + (this.uiScale - ev.base.height) / 2, lengthYPos)
					ev.length.height = y - lengthYPos

					//console.log(ev.base.y + ev.base.height/2,ev.base.y + ev.base.height/2 - ev.length.height)

					let text = note.type.toString()
					for (let value in noteTypes) {
						if (Number(value) && value === note.type.toString()) text = noteTypes[value]
					}
					ev.text.text = text
					ev.text.position.set(x + this.uiScale / 2, y)
				}

				if (graphicsObject) {
					if (note.selected) {
						graphicsObject.sprite.tint = 0x00ff00
					}
				}
			}
		}
	}

	bpmRender(app: PIXI.Application, notes: noteData[], baseBPM: number) {
		this.bpmContainer.removeChildren()
		let renderHeight = app.renderer.height - this.clickerOffset

		let resolution = 1 / 4

		for (let t = this.time; t < this.time + this.timeScale; ) {
			let lastBPMChange: noteData = { time: 0, type: 0, length: 0, lane: 0, extra: 0 }
			for (let n of notes) {
				if ((n.type === noteTypes.BPM || n.type === noteTypes.BPM_FAKE) && n.time <= t) lastBPMChange = n
			}
			let tickDelta = (resolution * baseBPM) / lastBPMChange.extra
			let closestBeat = Math.ceil((t - lastBPMChange.time) / tickDelta) * tickDelta + lastBPMChange.time

			let y = renderHeight - ((closestBeat - this.time) / this.timeScale) * renderHeight

			let g = new PIXI.Graphics()
			g.beginFill(0x333333)
			//if (Math.floor(i) === i) g.beginFill(0x555555)
			let height = 20
			g.drawRect(app.renderer.width / 2 - 2 * this.uiScale, y - height / 2, 4 * this.uiScale, height)
			this.bpmContainer.addChild(g)
			t += tickDelta
		}
	}

	moveView(delta: number) {
		this.time += (delta >= 0 ? this.timeScale : -this.timeScale) / 5
		if (this.time < 0) this.time = 0
	}

	setScale(scale: number) {
		this.uiScale = scale

		this.clickerBaseLeft.width = this.uiScale * 2
		this.clickerBaseLeft.height = this.uiScale

		this.clickerBaseRight.width = this.uiScale * 2
		this.clickerBaseRight.height = this.uiScale

		this.clickerGreen.width = this.uiScale
		this.clickerGreen.height = this.uiScale

		this.clickerRed.width = this.uiScale
		this.clickerRed.height = this.uiScale

		this.clickerBlue.width = this.uiScale
		this.clickerBlue.height = this.uiScale
	}

	setTimeScale(scale: number) {
		this.timeScale = scale
	}

	setViewOffset(val: number) {
		this.time = val
	}

	private getSprite(type: noteTypes) {
		if (!this.sprites[type]) {
			let collection = {
				objects: [],
				usedCount: 0
			}
			this.sprites[type] = collection
		}

		let count = this.sprites[type].usedCount
		let objects = this.sprites[type].objects

		if (count < objects.length) {
			this.sprites[type].usedCount++
			let sprite = objects[count]
			return sprite
		} else {
			let res = PIXI.Loader.shared.resources
			let tex = res[texID.TAP_R].texture

			if (type === noteTypes.TAP_G) tex = res[texID.TAP_G].texture
			else if (type === noteTypes.TAP_B) tex = res[texID.TAP_B].texture
			else if (type === noteTypes.SCR_G_UP || type === noteTypes.SCR_B_UP) tex = res[texID.SCR_UP].texture
			else if (type === noteTypes.SCR_G_DOWN || type === noteTypes.SCR_B_DOWN) tex = res[texID.SCR_DOWN].texture
			else if (type === noteTypes.SCR_G_ANYDIR || type === noteTypes.SCR_B_ANYDIR) tex = res[texID.SCR_ANYDIR].texture
			else if (type === noteTypes.CF_SPIKE_G) tex = res[texID.CF_SPIKE_GREEN].texture
			else if (type === noteTypes.CF_SPIKE_B) tex = res[texID.CF_SPIKE_BLUE].texture

			let sprite = new PIXI.Sprite(tex)
			sprite.anchor.set(0.5, 0.5)
			sprite.width = this.uiScale
			sprite.height = this.uiScale

			let graphic = new PIXI.Graphics()

			let object: grObject = {
				sprite: sprite,
				graphic: graphic
			}

			this.sprites[type].objects.push(object)
			this.container.addChild(graphic)
			this.container.addChild(sprite)
			this.sprites[type].usedCount++

			return object
		}
	}

	private resetSprites() {
		for (let collection of this.sprites) {
			if (collection) {
				collection.objects.forEach((obj) => {
					obj.sprite.position.set(120000, 120000)
					obj.sprite.width = this.uiScale
					obj.sprite.height = this.uiScale
					obj.sprite.tint = 0xffffff
					if (obj.sprite.scale.x < 0) obj.sprite.scale.x = -1 * obj.sprite.scale.x

					obj.graphic.clear()
				})
				collection.usedCount = 0
			}
		}
	}

	private getEvent() {
		if (this.eventRenderCount < this.events.length) {
			let graphic = this.events[this.eventRenderCount]
			this.eventRenderCount++
			return graphic
		} else {
			let thicc = 20
			let textStyle = new PIXI.TextStyle({ fontSize: thicc, fill: "white" })
			let color = 0x333333

			let base = new PIXI.Graphics()
			let text = new PIXI.Text("RESET", textStyle)
			let length = new PIXI.Graphics()

			base.beginFill(color)
			base.drawRect(0, 0, this.uiScale, thicc)

			text.anchor.set(0.5, 0.5)

			length.beginFill(color)
			length.drawRect(0, 0, thicc, 20)

			this.container.addChild(base)
			this.container.addChild(length)
			this.container.addChild(text)
			this.events.push({ base: base, text: text, length: length })

			this.eventRenderCount++
			return { base: base, text: text, length: length }
		}
	}

	private resetEvents() {
		for (let ev of this.events) {
			ev.base.position.set(120000, 120000)
			ev.length.position.set(120000, 120000)
			ev.text.position.set(120000, 120000)
		}
		this.eventRenderCount = 0
	}
}
