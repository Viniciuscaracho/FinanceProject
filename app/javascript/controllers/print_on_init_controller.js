import {Controller} from "@hotwired/stimulus"
import {debounce} from "lodash";

export default class extends Controller {

  connect() {
    document.addEventListener("turbo:frame-render", debounce(this.print, 1000))

  }

  print() {
    window.print()
  }
}
