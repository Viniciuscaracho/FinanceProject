import {Controller} from "@hotwired/stimulus"
import SlimSelect from 'slim-select'

export default class extends Controller {
  static values = {
    allowDeselect: {type: Boolean, default: true},
    placeholder: {type: String, default: 'tags...'}
  }

  connect() {
    this.select = new SlimSelect({
      select: this.element,
      settings: {
        allowDeselect: this.allowDeselectValue,
        placeholderText: this.placeholderValue
      },
      events: {
        addable: this.addable.bind(this)
      }
    })
  }

  addable(value) {
    return {
      text: value,
      value: value.toLowerCase()
    }
  }

  disconnect() {
    this.select.destroy()
  }
}
