import {Controller} from "@hotwired/stimulus"
import tippy from 'tippy.js'

export default class extends Controller {
  static targets = ["popover"]
  static values = {
    title: String,
    description: String,
    title2: String,
    description2: String
  }

  connect() {
    const value = this.data.get("value")
    tippy(this.popoverTarget, {
      content: `<div class="text-lg tracking-tight font-medium m-2">${this.titleValue}</div>
                      <div class="ml-2 mr-2 mb-2">${this.descriptionValue}</div>
                      <div class="text-lg tracking-tight font-medium m-2">${this.title2Value}</div>
                      <div class="ml-2 mr-2 mb-2">${this.description2Value}</div>`,
      theme: 'light',
      delay: [400, 0],
      allowHTML: true,
    })
  }
}