import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [ "background", "circle", "input" ]
  static classes = [ "backgroundEnabled", "circleEnabled" ]

  connect() {
    if (this.inputTarget.checked) {
      this.backgroundTarget.classList.add(this.backgroundEnabledClass)
      this.circleTarget.classList.add(this.circleEnabledClass)
    }
  }

  toggle() {
    this.backgroundTarget.classList.toggle(this.backgroundEnabledClass)
    this.circleTarget.classList.toggle(this.circleEnabledClass)
  }
}
