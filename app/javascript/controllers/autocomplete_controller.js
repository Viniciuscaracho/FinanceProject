import Autocomplete from 'stimulus-autocomplete'
import {createPopper} from '@popperjs/core';

export default class extends Autocomplete {
  static targets = ["extra"]
  static values = {
    offsetX: {type: Number, default: 0},
    offsetY: {type: Number, default: 4},
    preventOverflowPadding: {type: Number, default: 8},
    placement: {type: String, default: 'bottom-start'},
  }

  connect() {
    super.connect();
    this.popper = createPopper(this.inputTarget, this.resultsTarget, {
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

    this.element.addEventListener("loadend", (_) => this.popper.update())
  }

  disconnect() {
    super.disconnect();
    this.element.removeEventListener("loadend", (_) => this.popper.update())
    this.popper.destroy();
  }

  commit(selected) {
    super.commit(selected)
    const extraValue = selected.getAttribute("data-autocomplete-extra") || null
    if (this.hasExtraTarget) {
      if (extraValue) {
        this.extraTarget.value = extraValue
      } else {
        this.extraTarget.value = '0,00'
      }
      this.extraTarget.dispatchEvent(new Event("change"))
    }
  }

  onInputChange = () => {
    // if (this.hasHiddenTarget) this.hiddenTarget.value = ""
    // if (this.hasExtraTarget) this.extraTarget.value = ""

    const query = this.inputTarget.value.trim()
    if (query && query.length >= this.minLengthValue) {
      this.fetchResults(query)
    } else {
      this.hideAndRemoveOptions()
    }
  }

  clear() {
    super.clear()
    if (this.hasExtraTarget) this.extraTarget.value = ""
  }
}