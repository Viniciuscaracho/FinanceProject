import {Controller} from "@hotwired/stimulus"
import 'jquery-mask-plugin'

export default class extends Controller {
  maskBehavior(val) {
    const value = val.replaceAll(/\D/g, '')
    return value.length <= 11 ? '000.000.000-009999' : '00.000.000/0000-00';
  }

  onKeyPress(val, e, field, options) {
    field.mask(this.maskBehavior.apply({}, arguments), options);
  }

  connect() {
    const maskOptions = {
      onKeyPress: this.onKeyPress.bind(this)
    }

    $(this.element).mask(this.maskBehavior.bind(this), maskOptions)
  }

}
