import {Controller} from "@hotwired/stimulus"
import 'jquery-mask-plugin'

export default class extends Controller {
  static values = {
    pattern: String
  }

  connect() {
    let options = {
      reverse: true,
      clearIfNotMatch: true,
      selectOnFocus: true,
      translation: {
        '0': {
          pattern: /-|\d/,
          recursive: true
        }
      },
      onChange: function (value, e) {
        e.target.value = value.replace(/^-\./, '-').replace(/^-,/, '-').replace(/(?!^)-/g, '');
      }
    }

    $(this.element).mask(this.patternValue, options);
  }
}
