import {Controller} from "@hotwired/stimulus"
import {get} from "@rails/request.js"

export default class extends Controller {
  static values = {
    url: {type: String, default: ''},
    turbo: {type: Boolean, default: false},
    frame: {type: String, default: '_top'}
  }

  connect() {
    this.element.addEventListener("click", this.goTo.bind(this))
    super.connect()
  }

  disconnect() {
    this.element.removeEventListener("click", this.goTo.bind(this))
    super.disconnect();
  }

  async goTo(event) {
    // check if event target is a link
    if (this.element.contains(event.target) && (event.target.closest('button') || event.target.closest('a'))) {
      return
    }

    if (this.turboValue) {
      await get(this.urlValue, {responseKind: "turbo-stream"})
    } else {
      if (!this.hasFrameValue || this.frameValue === '_top') {
        window.location.href = this.urlValue
        return
      }
      window.Turbo.visit(this.urlValue, {frame: this.frameValue, action: 'advance'})
    }
  }
}