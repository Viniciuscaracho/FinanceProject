import {Controller} from "@hotwired/stimulus"
import 'jquery-mask-plugin'

export default class extends Controller {
  static values = {
    pattern: String,
    placeholder: String,
    reverse: Boolean,
    clearIfNotMatch: Boolean,
    selectOnFocus: Boolean,
  }

  connect() {
    let options = {
      reverse: this.hasReverseValue ? this.reverseValue : false,
      placeholder: this.hasPlaceholderValue ? this.placeholderValue : undefined,
      clearIfNotMatch: this.hasClearIfNotMatchValue ? this.clearIfNotMatchValue : false,
      selectOnFocus: this.hasSelectOnFocusValue ? this.selectOnFocusValue : false
    }

    $(this.element).mask(this.patternValue, options);
  }

  disconnect() {
    super.disconnect();
    $(this.element).mask('destroy');
  }
}
