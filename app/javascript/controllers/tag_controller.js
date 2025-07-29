import {Controller} from "@hotwired/stimulus"

const {debounce} = require("lodash")
export default class extends Controller {
  connect() {
    let that = this;
    that.element.addEventListener('change', debounce(that.handleChange, 2000))
  }

  handleChange(event) {
    event.preventDefault()
    event.target.form.requestSubmit()
  }
}