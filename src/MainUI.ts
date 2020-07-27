import * as PIXI from "pixi.js"
import UIButton from "./UIButton"
import UISprite from "./UISprite"
import UIwindow from "./UIWindow"
import UIWindow from "./UIWindow"

class UI {
	rootWindow = new UIWindow(0, 0)
	uiContainer = new PIXI.Container()
	constructor(appContainer: PIXI.Container) {
		appContainer.addChild(this.uiContainer)

		this.rootWindow = new UIWindow(10, 10, [
			new UIButton(
				20,
				20,
				50,
				50,
				() => {
					console.log("CLICK")
				},
				[new UISprite(0, 0, 50, 50, "anydir.png")]
			)
		])

		console.log(this.rootWindow)
	}

	draw() {
		this.uiContainer.removeChildren()
		this.rootWindow.ticker(this.uiContainer)
	}

	bubbleEvents(ev: Event) {
		this.rootWindow.bubbleEvents(ev)
	}
}

export default UI
