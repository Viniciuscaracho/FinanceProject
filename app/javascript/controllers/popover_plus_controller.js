import {Controller} from "@hotwired/stimulus"
import {get} from "@rails/request.js";
import tippy from 'tippy.js'

export default class extends Controller {
  static targets = ["popover"]
  static values = {
    url: String
  }

  async connect() {
    await this.set_tippy()
    this.data.get("value");
  }

  disconnect() {
    super.disconnect();
  }

  async set_tippy() {
    let response = await get(this.urlValue, {responseKind: 'html'});
    let html = await response.html

    await tippy(this.popoverTarget, {
      content: html,
      placement: 'right-end',
      theme: 'light',
      delay: [400, 0],
      allowHTML: true
    });
  }
}