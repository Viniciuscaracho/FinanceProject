// Example usage:
// <div data-controller="tooltip" data-tippy-content="Hello world"></div>
import {Controller} from "@hotwired/stimulus"
import tippy from 'tippy.js';

export default class extends Controller {
  static values = {
    content: String,
    placement: String,
    arrow: Boolean
  }

  initialize() {
    let options = {}
    if (this.hasContentValue) {
      options['content'] = this.contentValue
    }
    if (this.hasPlacementValue) {
      options['placement'] = this.placementValue
    }
    if (this.hasArrowValue) {
      options['arrow'] = this.arrowValue
    }
    this.tippy = tippy(this.element, options);
  }

  disconnect() {
    this.tippy.destroy();
  }
}