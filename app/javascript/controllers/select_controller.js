import {Controller} from "@hotwired/stimulus"
import SlimSelect from 'slim-select'

export default class extends Controller {
  static values = {
    allowDeselect: {type: Boolean, default: false},
    placeholder: {type: String, default: ''}
  }

  async connect() {
    this.select = new SlimSelect({
      select: this.element,
      settings: {
        allowDeselect: this.allowDeselectValue,
        placeholderText: this.placeholderValue
      }
    })
  }

  disconnect() {
    this.select.destroy()
  }
}
