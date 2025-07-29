import {Controller} from "@hotwired/stimulus"
import {patch} from "@rails/request.js";

export default class extends Controller {
  static targets = ["summarizer"]
  static values = {url: String}


  toggle(event) {
    this.applyClass()
    this.updateUserSettings()
  }

  async updateUserSettings() {
    await patch(this.urlValue, {
      responseKind: 'turbo-stream'
    })
  }

  applyClass() {
    this.summarizerTarget.classList.toggle("static");
  }

}
