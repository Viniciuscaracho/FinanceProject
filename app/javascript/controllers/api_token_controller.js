import {Controller} from "@hotwired/stimulus"


export default class extends Controller {

  static targets = ['toggle', 'toggleIcon']

  connect() {
  }

  toggle() {
    this.toggleIconTargets.forEach((icon) => {
      icon.classList.toggle('hidden')
    })
    this.toggleTarget.classList.toggle('hidden')
  }

}
