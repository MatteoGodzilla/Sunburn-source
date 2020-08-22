import { noteData, noteTypes } from "./CustomTypes"
import * as PIXI from "pixi.js"
import { NoteLoader } from "./NoteLoader"

enum texID {
	TAP_G = "res/green-note.png",
	TAP_R = "res/red-note.png",
	TAP_B = "res/blue-note.png",
	SCR_UP = "res/up.png",
	SCR_DOWN = "res/down.png",
	SCR_ANYDIR = "res/anydir.png",
	CF_SPIKE_GREEN = "res/cf-spike-green.png",
	CF_SPIKE_BLUE = "res/cf-spike-blue.png",
	CLICKER_G = "res/clicker-green.png",
	CLICKER_R = "res/clicker-red.png",
	CLICKER_B = "res/clicker-blue.png",
	CLICKER_BASE = "res/clicker-side-base.png",
	FS_SAMPLES = "res/fs-samples.png"
}

let textures: string[] = []

for (let v in texID) {
	textures.push(texID[v])
}

interface grObject {
	sprite: PIXI.Sprite
	graphic: PIXI.Graphics
}

enum Layers {
	EUPHORIA,
	EFFECTS,
	SCRATCH_ZONE,
	NOTE
}

enum Colors {
	GREEN = 0x22df2e,
	RED = 0xd21c1c,
	BLUE = 0x3d4ebe,
	WHITE = 0xffffff,
	ORANGE = 0xeb6818,
	GRAY = 0x333333,
	HIGHLIGHT = 0xffcc00
}

export class NoteRender {
	private container: PIXI.Container
	private bpmContainer: PIXI.Container
	time = 0
	uiScale = 75
	timeScale = 100
	clickerOffset = 100
	bpmResolution = 1 / 4
	private crossPosition = 1
	private padding = 10

	private clickerBaseLeft = new PIXI.Sprite()
	private clickerBaseRight = new PIXI.Sprite()
	private clickerGreen = new PIXI.Sprite()
	private clickerRed = new PIXI.Sprite()
	private clickerBlue = new PIXI.Sprite()

	private redGraphic = new PIXI.Graphics()
	private greenGraphic = new PIXI.Graphics()
	private blueGraphic = new PIXI.Graphics()

	private sprites: {
		id: noteTypes
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
		this.container.sortableChildren = true
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
			this.redGraphic.lineStyle(this.lineWidth, Colors.RED)
			redLanePoints.forEach((point) => {
				this.redGraphic.lineTo(point.x, point.y)
			})
			this.container.addChild(this.redGraphic)

			this.greenGraphic = new PIXI.Graphics()
			this.greenGraphic.lineStyle(this.lineWidth, Colors.GREEN)
			this.container.addChild(this.greenGraphic)

			this.blueGraphic = new PIXI.Graphics()
			this.blueGraphic.lineStyle(this.lineWidth, Colors.BLUE)
			this.container.addChild(this.blueGraphic)
		})

		/*
		let test = new PIXI.Text("ASDFASDF",new PIXI.TextStyle({fill:Colors.WHITE}))
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

		let greenLanePoints = []
		let blueLanePoints = []
		let redLanePoints = []

		this.greenGraphic.clear()
		this.blueGraphic.clear()
		this.redGraphic.clear()

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
			this.greenGraphic.lineStyle(this.lineWidth, Colors.GREEN)
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
			this.blueGraphic.lineStyle(this.lineWidth, Colors.BLUE)
			this.blueGraphic.lineTo(point.x, point.y)
			lastBluePoint = point
		})

		redLanePoints.push(new PIXI.Point(0, 0))
		redLanePoints.push(new PIXI.Point(0, -renderHeight))

		this.redGraphic.lineStyle(this.lineWidth, Colors.RED)
		redLanePoints.forEach((point) => {
			this.redGraphic.lineTo(point.x, point.y)
		})

		this.redGraphic.position.set(app.renderer.width / 2, renderHeight)

		this.resetSprites()
		this.resetEvents()

		for (let i = arr.length - 1; i >= 0; i--) {
			const note = arr[i]
			if (note.time < this.time + this.timeScale && ((note.length <= 0.0625 && note.time >= this.time) || (note.length > 0.0625 && note.time + note.length >= this.time))) {
				let x = app.renderer.width / 2
				let y = this.getYfromTime(note.time, renderHeight)

				let graphicsObject: grObject | undefined = undefined

				if (note.type === noteTypes.TAP_G || note.type === noteTypes.SCR_G_UP || note.type === noteTypes.SCR_G_DOWN || note.type === noteTypes.SCR_G_ANYDIR) {
					x -= (note.lane == 0 ? 2 : 1) * this.uiScale
					graphicsObject = this.getSprite(note.type)
					graphicsObject.sprite.position.set(x, y)

					graphicsObject.sprite.zIndex = Layers.NOTE
					graphicsObject.graphic.zIndex = Layers.NOTE

					if (note.length > 0.0625) {
						let crossfades: noteData[] = []
						let width = 40
						graphicsObject.graphic.beginFill(Colors.WHITE, 0.5)

						for (let check of arr) {
							if (check.time > note.time && check.time <= note.time + note.length && (check.type === noteTypes.CROSS_G || check.type === noteTypes.CROSS_C || check.type === noteTypes.CROSS_B)) {
								crossfades.push(check)
							}
						}

						if (crossfades.length === 0) {
							//straight tail
							let startHeight = this.getYfromTime(note.time + note.length, renderHeight)
							graphicsObject.graphic.drawRect(x - width / 2, startHeight, width, y - startHeight)
						} else {
							let pastLane = note.lane
							let pastTime = note.time
							for (let c of crossfades) {
								if ((c.type === noteTypes.CROSS_C || c.type === noteTypes.CROSS_B) && pastLane === 0) {
									//left to center position
									x = app.renderer.width / 2 - 2 * this.uiScale
									pastLane = 1
								} else if (c.type === noteTypes.CROSS_G && pastLane === 1) {
									//center to left position
									x = app.renderer.width / 2 - this.uiScale
									pastLane = 0
								}

								let topY = this.getYfromTime(c.time, renderHeight)
								let bottomY = this.getYfromTime(pastTime, renderHeight)

								graphicsObject.graphic.drawRect(x - width / 2, topY, width, bottomY - topY)
								pastTime = c.time
							}
							x = app.renderer.width / 2 - (pastLane == 0 ? 2 : 1) * this.uiScale
							let topY = this.getYfromTime(note.time + note.length, renderHeight)
							let bottomY = this.getYfromTime(pastTime, renderHeight)

							graphicsObject.graphic.drawRect(x - width / 2, topY, width, bottomY - topY)
						}
					}
				} else if (note.type === noteTypes.TAP_R) {
					graphicsObject = this.getSprite(note.type)
					graphicsObject.sprite.position.set(x, y)

					graphicsObject.sprite.zIndex = Layers.NOTE
					graphicsObject.graphic.zIndex = Layers.NOTE

					if (note.length > 0.0625) {
						//add tail
						let width = 40
						let startHeight = this.getYfromTime(note.time + note.length, renderHeight)

						graphicsObject.graphic.beginFill(Colors.WHITE, 0.5)
						graphicsObject.graphic.drawRect(x - width / 2, startHeight, width, y - startHeight)
					}
				} else if (note.type === noteTypes.TAP_B || note.type === noteTypes.SCR_B_UP || note.type === noteTypes.SCR_B_DOWN || note.type === noteTypes.SCR_B_ANYDIR) {
					x += (note.lane == 2 ? 2 : 1) * this.uiScale
					graphicsObject = this.getSprite(note.type)
					graphicsObject.sprite.position.set(x, y)

					graphicsObject.sprite.zIndex = Layers.NOTE
					graphicsObject.graphic.zIndex = Layers.NOTE

					if (note.length > 0.0625) {
						let crossfades: noteData[] = []
						let width = 40
						graphicsObject.graphic.beginFill(Colors.WHITE, 0.5)

						for (let check of arr) {
							if (check.time > note.time && check.time <= note.time + note.length && (check.type === noteTypes.CROSS_G || check.type === noteTypes.CROSS_C || check.type === noteTypes.CROSS_B)) {
								crossfades.push(check)
							}
						}

						if (crossfades.length === 0) {
							//straight tail
							let startHeight = this.getYfromTime(note.time + note.length, renderHeight)
							graphicsObject.graphic.drawRect(x - width / 2, startHeight, width, y - startHeight)
						} else {
							let pastLane = note.lane
							let pastTime = note.time
							for (let c of crossfades) {
								if ((c.type === noteTypes.CROSS_C || c.type === noteTypes.CROSS_G) && pastLane === 2) {
									//left to center position
									x = app.renderer.width / 2 + 2 * this.uiScale
									pastLane = 1
								} else if (c.type === noteTypes.CROSS_B && pastLane === 1) {
									//center to left position
									x = app.renderer.width / 2 + this.uiScale
									pastLane = 2
								}

								let topY = this.getYfromTime(c.time, renderHeight)
								let bottomY = this.getYfromTime(pastTime, renderHeight)

								graphicsObject.graphic.drawRect(x - width / 2, topY, width, bottomY - topY)
								pastTime = c.time
							}
							x = app.renderer.width / 2 + (pastLane == 2 ? 2 : 1) * this.uiScale
							let topY = this.getYfromTime(note.time + note.length, renderHeight)
							let bottomY = this.getYfromTime(pastTime, renderHeight)

							graphicsObject.graphic.drawRect(x - width / 2, topY, width, bottomY - topY)
						}
					}
				} else if (note.type === noteTypes.FX_G) {
					x -= 2.5 * this.uiScale
					graphicsObject = this.getSprite(note.type)
					graphicsObject.graphic.beginFill(Colors.ORANGE, 0.25)

					graphicsObject.graphic.zIndex = Layers.EFFECTS

					let startHeight = this.getYfromTime(note.time + note.length, renderHeight)

					graphicsObject.graphic.drawRect(x, startHeight + this.padding, this.uiScale * 2, y - startHeight - this.padding)
				} else if (note.type === noteTypes.FX_B) {
					x += 0.5 * this.uiScale
					graphicsObject = this.getSprite(note.type)
					graphicsObject.graphic.beginFill(Colors.ORANGE, 0.25)

					graphicsObject.graphic.zIndex = Layers.EFFECTS

					let startHeight = this.getYfromTime(note.time + note.length, renderHeight)

					graphicsObject.graphic.drawRect(x, startHeight + this.padding, this.uiScale * 2, y - startHeight - this.padding)
				} else if (note.type === noteTypes.FX_R) {
					x -= 0.5 * this.uiScale
					graphicsObject = this.getSprite(note.type)
					graphicsObject.graphic.beginFill(Colors.ORANGE, 0.25)

					graphicsObject.graphic.zIndex = Layers.EFFECTS

					let startHeight = this.getYfromTime(note.time + note.length, renderHeight)

					graphicsObject.graphic.drawRect(x, startHeight + this.padding, this.uiScale * 1, y - startHeight - this.padding)
				} else if (note.type === noteTypes.FX_ALL) {
					x -= 2.5 * this.uiScale
					graphicsObject = this.getSprite(note.type)
					graphicsObject.graphic.beginFill(Colors.ORANGE, 0.25)

					graphicsObject.graphic.zIndex = Layers.EFFECTS

					let startHeight = this.getYfromTime(note.time + note.length, renderHeight)

					graphicsObject.graphic.drawRect(x, startHeight + this.padding, this.uiScale * 5, y - startHeight - this.padding)
				} else if (note.type === noteTypes.EUPHORIA) {
					x -= 2.5 * this.uiScale
					graphicsObject = this.getSprite(note.type)
					graphicsObject.graphic.beginFill(Colors.WHITE, 0.25)

					graphicsObject.graphic.zIndex = Layers.EUPHORIA

					let startHeight = this.getYfromTime(note.time + note.length, renderHeight)

					graphicsObject.graphic.drawRect(x, startHeight, this.uiScale * 5, y - startHeight)
				} else if (note.type === noteTypes.FS_SAMPLES) {
					graphicsObject = this.getSprite(note.type)
					let startHeight = this.getYfromTime(note.time + note.length, renderHeight)

					graphicsObject.graphic.zIndex = Layers.EUPHORIA
					graphicsObject.sprite.zIndex = Layers.NOTE

					graphicsObject.sprite.position.set(x, y)

					graphicsObject.graphic.beginFill(Colors.RED, 0.75)
					graphicsObject.graphic.drawRect(x - this.uiScale / 2, startHeight, this.uiScale * 1, y - startHeight)
				} else if (note.type === noteTypes.FS_CROSS) {
					graphicsObject = this.getSprite(note.type)
					let startHeight = this.getYfromTime(note.time + note.length, renderHeight)

					graphicsObject.graphic.zIndex = Layers.EUPHORIA

					let xLeft = app.renderer.width / 2 - this.uiScale * 2
					let xRight = app.renderer.width / 2 + this.uiScale * 1

					graphicsObject.graphic.beginFill(Colors.GREEN, 0.25)
					graphicsObject.graphic.drawRect(xLeft, startHeight, this.uiScale * 1, y - startHeight)

					graphicsObject.graphic.beginFill(Colors.BLUE, 0.25)
					graphicsObject.graphic.drawRect(xRight, startHeight, this.uiScale * 1, y - startHeight)
				} else if (note.type === noteTypes.SCR_G_ZONE) {
					x -= (note.lane == 0 ? 2 : 1) * this.uiScale
					let crossfades: noteData[] = []
					let width = this.uiScale
					graphicsObject = this.getSprite(note.type)
					graphicsObject.graphic.beginFill(Colors.GREEN, 1.0)
					graphicsObject.graphic.zIndex = Layers.SCRATCH_ZONE

					for (let check of arr) {
						if (check.time > note.time && check.time <= note.time + note.length && (check.type === noteTypes.CROSS_G || check.type === noteTypes.CROSS_C || check.type === noteTypes.CROSS_B)) {
							crossfades.push(check)
						}
					}

					if (crossfades.length === 0) {
						//straight tail
						let startHeight = this.getYfromTime(note.time + note.length, renderHeight)
						graphicsObject.graphic.drawRect(x - width / 2, startHeight, width, y - startHeight)
					} else {
						let pastLane = note.lane
						let pastTime = note.time
						for (let c of crossfades) {
							if ((c.type === noteTypes.CROSS_C || c.type === noteTypes.CROSS_B) && pastLane === 0) {
								//left to center position
								x = app.renderer.width / 2 - 2 * this.uiScale
								pastLane = 1
							} else if (c.type === noteTypes.CROSS_G && pastLane === 1) {
								//center to left position
								x = app.renderer.width / 2 - this.uiScale
								pastLane = 0
							}

							let topY = this.getYfromTime(c.time, renderHeight)
							let bottomY = this.getYfromTime(pastTime, renderHeight)

							graphicsObject.graphic.drawRect(x - width / 2, topY, width, bottomY - topY)
							pastTime = c.time
						}
						x = app.renderer.width / 2 - (pastLane == 0 ? 2 : 1) * this.uiScale
						let topY = this.getYfromTime(note.time + note.length, renderHeight)
						let bottomY = this.getYfromTime(pastTime, renderHeight)

						graphicsObject.graphic.drawRect(x - width / 2, topY, width, bottomY - topY)
					}
				} else if (note.type === noteTypes.SCR_B_ZONE) {
					x += (note.lane == 2 ? 2 : 1) * this.uiScale
					let crossfades: noteData[] = []
					let width = this.uiScale
					graphicsObject = this.getSprite(note.type)
					graphicsObject.graphic.beginFill(Colors.BLUE, 1.0)
					graphicsObject.graphic.zIndex = Layers.SCRATCH_ZONE

					for (let check of arr) {
						if (check.time > note.time && check.time <= note.time + note.length && (check.type === noteTypes.CROSS_G || check.type === noteTypes.CROSS_C || check.type === noteTypes.CROSS_B)) {
							crossfades.push(check)
						}
					}

					if (crossfades.length === 0) {
						//straight tail
						let startHeight = this.getYfromTime(note.time + note.length, renderHeight)
						graphicsObject.graphic.drawRect(x - width / 2, startHeight, width, y - startHeight)
					} else {
						let pastLane = note.lane
						let pastTime = note.time
						for (let c of crossfades) {
							if ((c.type === noteTypes.CROSS_C || c.type === noteTypes.CROSS_G) && pastLane === 2) {
								//right to center position
								x = app.renderer.width / 2 + 2 * this.uiScale
								pastLane = 1
							} else if (c.type === noteTypes.CROSS_B && pastLane === 1) {
								//center to right position
								x = app.renderer.width / 2 + this.uiScale
								pastLane = 2
							}

							let topY = this.getYfromTime(c.time, renderHeight)
							let bottomY = this.getYfromTime(pastTime, renderHeight)

							graphicsObject.graphic.drawRect(x - width / 2, topY, width, bottomY - topY)
							pastTime = c.time
						}
						x = app.renderer.width / 2 + (pastLane == 2 ? 2 : 1) * this.uiScale
						let topY = this.getYfromTime(note.time + note.length, renderHeight)
						let bottomY = this.getYfromTime(pastTime, renderHeight)

						graphicsObject.graphic.drawRect(x - width / 2, topY, width, bottomY - topY)
					}
				} else if (note.type === noteTypes.FS_CF_G_MARKER) {
					graphicsObject = this.getSprite(note.type)

					let startHeight = this.getYfromTime(note.time + note.length, renderHeight)

					let width = this.uiScale / 5

					graphicsObject.graphic.zIndex = Layers.EUPHORIA

					graphicsObject.graphic.beginFill(Colors.GREEN, 1.0)

					graphicsObject.graphic.drawRect(x - this.uiScale * 2, startHeight + this.padding / 2, width, y - startHeight - this.padding / 2)
				} else if (note.type === noteTypes.FS_CF_B_MARKER) {
					graphicsObject = this.getSprite(note.type)

					let startHeight = this.getYfromTime(note.time + note.length, renderHeight)

					let width = this.uiScale / 5

					graphicsObject.graphic.zIndex = Layers.EUPHORIA

					graphicsObject.graphic.beginFill(Colors.BLUE, 1.0)

					graphicsObject.graphic.drawRect(x + this.uiScale * 2 - width, startHeight + this.padding / 2, width, y - startHeight - this.padding / 2)
				} else if (note.type === noteTypes.CF_SPIKE_G) {
					x -= this.uiScale * 1.5
					graphicsObject = this.getSprite(note.type)
					graphicsObject.sprite.position.set(x, y)
					graphicsObject.sprite.height = this.uiScale / 2

					graphicsObject.sprite.zIndex = Layers.NOTE

					if (NoteLoader.getCrossAtTime(note.time, arr) == 2) {
						x += this.uiScale * 3
						let s = this.getSprite(noteTypes.CF_SPIKE_B)
						s.sprite.position.set(x, y)
						s.sprite.height = this.uiScale / 2
						s.sprite.scale.x = -1 * s.sprite.scale.x

						s.sprite.zIndex = 2
					}
				} else if (note.type === noteTypes.CF_SPIKE_B) {
					x += this.uiScale * 1.5
					graphicsObject = this.getSprite(note.type)
					graphicsObject.sprite.height = this.uiScale / 2
					graphicsObject.sprite.position.set(x, y)

					graphicsObject.sprite.zIndex = Layers.NOTE

					if (NoteLoader.getCrossAtTime(note.time, arr) == 0) {
						x -= this.uiScale * 3
						let s = this.getSprite(noteTypes.CF_SPIKE_G)
						s.sprite.position.set(x, y)
						s.sprite.height = this.uiScale / 2
						s.sprite.scale.x = -1 * s.sprite.scale.x

						s.sprite.zIndex = 2
					}
				} else if (note.type === noteTypes.CF_SPIKE_C) {
					graphicsObject = this.getSprite(noteTypes.CF_SPIKE_G)
					x -= this.uiScale * 1.5
					if (NoteLoader.getCrossAtTime(note.time, arr) == 2) {
						x += this.uiScale * 3
						graphicsObject = this.getSprite(noteTypes.CF_SPIKE_B)
					}
					graphicsObject.sprite.height = this.uiScale / 2
					graphicsObject.sprite.scale.x = -1 * graphicsObject.sprite.scale.x
					graphicsObject.sprite.position.set(x, y)
					graphicsObject.sprite.zIndex = Layers.NOTE
				} else if (note.type === noteTypes.BPM_FAKE) {
					let ev = this.getEvent()
					x -= this.uiScale * 4

					//let lengthY = renderHeight - ((note.time + note.length - this.time) / this.timeScale) * renderHeight

					if (this.eventRenderCount >= 2) {
						for (let i = 0; i < this.eventRenderCount - 1; ++i) {
							let after = this.events[i]
							let afterHeight = after.base.y + after.base.height / 2
							if (y === afterHeight && after.base.x < app.renderer.width / 2) {
								this.events[i].base.x -= this.uiScale * 1.5
								this.events[i].length.x -= this.uiScale * 1.5
								this.events[i].text.x -= this.uiScale * 1.5
							}
						}
					}

					ev.base.position.set(x, y - ev.base.height / 2)

					//ev.length.position.set(x - (this.uiScale - ev.base.height) / 2, lengthY)
					//ev.length.height = y - lengthY

					let text = note.extra.toFixed(0)
					/* for(let value in noteTypes){
						if(Number(value) && value === note.type.toString()) text = noteTypes[value]
					} */
					ev.text.text = text
					ev.text.position.set(x + this.uiScale / 2, y)
				} else if (note.type !== noteTypes.CROSS_G && note.type !== noteTypes.CROSS_B && note.type !== noteTypes.CROSS_C && note.type !== noteTypes.BPM) {
					let ev = this.getEvent()
					x += this.uiScale * 3

					let lengthYPos = this.getYfromTime(note.time + note.length, renderHeight)

					if (this.eventRenderCount >= 2) {
						for (let i = 0; i < this.eventRenderCount - 1; ++i) {
							let after = this.events[i]
							let afterHeight = after.base.y + after.base.height / 2
							if (y >= afterHeight && lengthYPos <= afterHeight && after.base.x > app.renderer.width / 2) {
								this.events[i].base.x += this.uiScale * 1.5
								this.events[i].length.x += this.uiScale * 1.5
								this.events[i].text.x += this.uiScale * 1.5
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
						graphicsObject.sprite.tint = Colors.HIGHLIGHT
					}
				}
			}
		}
	}

	bpmRender(app: PIXI.Application, notes: noteData[], baseBPM: number) {
		this.bpmContainer.removeChildren()
		let renderHeight = app.renderer.height - this.clickerOffset

		for (let t = this.time; t < this.time + this.timeScale; ) {
			let lastBPMChange: noteData = { time: 0, type: 0, length: 0, lane: 0, extra: 0 }
			for (let n of notes) {
				if ((n.type === noteTypes.BPM || n.type === noteTypes.BPM_FAKE) && n.time <= t) lastBPMChange = n
			}
			let tickDelta = (this.bpmResolution * baseBPM) / lastBPMChange.extra
			let closestBeat = Math.ceil((t - lastBPMChange.time) / tickDelta) * tickDelta + lastBPMChange.time

			let y = renderHeight - ((closestBeat - this.time) / this.timeScale) * renderHeight

			let g = new PIXI.Graphics()
			g.beginFill(Colors.GRAY)
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

	private collectionIndex(type: noteTypes) {
		let index = -1
		for (let i = 0; i < this.sprites.length; ++i) {
			if (this.sprites[i].id === type) {
				index = i
				break
			}
		}
		return index
	}

	private getSprite(type: noteTypes) {
		if (this.collectionIndex(type) === -1) {
			let collection = {
				id: type,
				objects: [],
				usedCount: 0
			}
			this.sprites.push(collection)
		}

		let index = this.collectionIndex(type)

		let count = this.sprites[index].usedCount
		let objects = this.sprites[index].objects

		if (count < objects.length) {
			this.sprites[index].usedCount++
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
			else if (type === noteTypes.FS_SAMPLES) tex = res[texID.FS_SAMPLES].texture

			let sprite = new PIXI.Sprite(tex)
			sprite.anchor.set(0.5, 0.5)
			sprite.width = this.uiScale
			sprite.height = this.uiScale

			if (type === noteTypes.SCR_G_UP || type === noteTypes.SCR_B_UP || type === noteTypes.SCR_G_DOWN || type === noteTypes.SCR_B_DOWN || type === noteTypes.SCR_G_ANYDIR || type === noteTypes.SCR_B_ANYDIR) {
				sprite.anchor.set(0.5, 0.75)
			}

			let graphic = new PIXI.Graphics()

			let object: grObject = {
				sprite: sprite,
				graphic: graphic
			}

			this.sprites[index].objects.push(object)
			this.container.addChild(graphic)
			this.container.addChild(sprite)
			this.sprites[index].usedCount++

			return object
		}
	}

	private resetSprites() {
		for (let collection of this.sprites) {
			collection.objects.forEach((obj) => {
				obj.sprite.position.set(120000, 120000)
				obj.sprite.width = this.uiScale
				obj.sprite.height = this.uiScale
				obj.sprite.tint = Colors.WHITE
				if (obj.sprite.scale.x < 0) obj.sprite.scale.x = -1 * obj.sprite.scale.x

				obj.graphic.clear()
			})
			collection.usedCount = 0
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
			let color = Colors.GRAY

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

	private getYfromTime(time: number, renderHeight: number) {
		let y = renderHeight - ((time - this.time) / this.timeScale) * renderHeight
		return Math.min(y, renderHeight)
	}
}
