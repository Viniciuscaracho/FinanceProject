import {Controller} from "@hotwired/stimulus"
import {createPopper} from '@popperjs/core';

export default class extends Controller {
  static targets = ["activator", "menu"]
  static values = {placement: {type: String, default: 'left'}}

  async connect() {
    this.popper = createPopper(this.activatorTarget, this.menuTarget, {
      placement: this.placementValue,
      modifiers: [
        {
          name: 'preventOverflow',
          options: {
            padding: 8,
            rootBoundary: 'document',
          },
        },
        {
          name: 'offset',
          options: {
            offset: [0, 8],
          },
        }
      ]
    });

    document.addEventListener("turbo:frame-load", (_) => this.popper.update())
  }

  async disconnect() {
    document.removeEventListener("turbo:frame-load", (_) => this.popper.update())
    this.popper.destroy()
  }

  async toggle(event) {
    if (!this.menuTarget.classList.toggle("hidden")) {
      await this.popper.update()
    }
  }

  async hide(event) {
    if (this.element.contains(event.target)) return
    await this.hideMenu()
  }

  async hideWithKeyboard(event) {
    if (event.code === "Escape") {
      await this.hideMenu()
    }
  }

  async hideMenu() {
    this.menuTarget.classList.add("hidden")
  }
}

