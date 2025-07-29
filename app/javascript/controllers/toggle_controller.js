import {Controller} from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["bar", "pin"]

  connect() {
    if (this.element.value === 'true') {
      this.element.classList.add('toggle--active')
    }
  }

  switch(event) {
    this.element.classList.toggle('toggle--active')
  }
}
