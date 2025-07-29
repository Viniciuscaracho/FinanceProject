import {Controller} from "@hotwired/stimulus"
import {createPopper} from '@popperjs/core';

export default class extends Controller {
  static targets = ["reference", "popper"]
  static values = {
    offsetX: {type: Number, default: 0},
    offsetY: {type: Number, default: -4},
    preventOverflowPadding: {type: Number, default: 8},
    placement: {type: String, default: 'bottom'},
  }

  connect() {
    this.popper = createPopper(this.referenceTarget, this.popperTarget, {
      placement: this.placementValue,
      modifiers: [
        {
          name: 'preventOverflow',
          options: {
            padding: this.preventOverflowPaddingValue,
            boundary: document.body,
            rootBoundary: document.body,
          },
        },
        {
          name: 'offset',
          options: {
            offset: [this.offsetXValue, this.offsetYValue],
          },
        }
      ]
    });
  }

  disconnect() {
    super.disconnect();
    this.popper.destroy();
  }
}