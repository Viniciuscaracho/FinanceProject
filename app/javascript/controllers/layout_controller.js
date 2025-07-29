import {Controller} from "@hotwired/stimulus"
import {patch} from "@rails/request.js"

export default class extends Controller {
  static outlets = ["tooltip"]

  static values = {
    collapsed: Boolean,
    url: String
  }

  connect() {
    this.toggleTippy = this.toggleTippy.bind(this)

    this.applyClass()
  }

  async updateUserSettings() {
    await patch(this.urlValue, {
      responseKind: 'turbo-stream',
      body: {
        collapsed_menu: this.collapsedValue
      }
    })
  }

  toggle(event) {
    this.collapsedValue = !this.collapsedValue
    this.applyClass()
    this.updateUserSettings()
    this.toggleTooltip()
  }

  applyClass() {
    if (this.collapsedValue) {
      this.element.classList.add('layout__collapsed')
    } else {
      this.element.classList.remove('layout__collapsed')
    }
  }

  tooltipOutletConnected(outlet, _element) {
    if (!outlet.tippy) return

    this.toggleTippy(outlet.tippy)
  }

  toggleTooltip() {
    this.tooltipOutlets.forEach((tooltip) => {
      if (!tooltip.tippy) return;

      this.toggleTippy(tooltip.tippy)
    })
  }

  toggleTippy(tippy) {
    if (this.collapsedValue) {
      tippy.enable()
    } else {
      tippy.disable()
    }
  }
}
