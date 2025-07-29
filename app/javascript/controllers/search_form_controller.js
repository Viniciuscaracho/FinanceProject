import {Controller} from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    super.connect()
  }

  onResetSearch(event) {
    if ([undefined, null, ''].includes(event.target.value)) {
      this.element.requestSubmit()
    }
  }
}
