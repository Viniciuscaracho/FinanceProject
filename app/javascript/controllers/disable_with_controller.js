import {Controller} from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.actualValue = this.element.innerHTML
  }

  activate() {
    this.element.innerText = this.element.dataset.disableWith
  }
}
