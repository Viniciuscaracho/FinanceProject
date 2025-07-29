import {Controller} from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    target: String
  }

  connect() {
    this.toggle(this.data.element.checked, this.targetValue)
  }

  toggle_div(e) {
    this.toggle(e.target.checked, this.targetValue)
  }

  toggle(checked, target) {
    if (checked) {
      $(target).show()
    } else {
      $(target).hide()
    }
  }
}
