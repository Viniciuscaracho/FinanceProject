import {Controller} from "@hotwired/stimulus"
import {enter, leave, toggle} from 'el-transition'

export default class extends Controller {
  static targets = ["menu", "caret"]
  static classes = ["rotate", "expanded"]
  static values = {
    expanded: {
      type: Boolean,
      default: false
    }
  }

  async connect() {
    if (this.expandedValue) {
      await enter(this.menuTarget)
      this.caretTarget.classList.add(this.rotateClass)
    } else {
      await leave(this.menuTarget)
      this.caretTarget.classList.remove(this.rotateClass)
    }
  }

  async toggle(event) {
    await toggle(this.menuTarget)
    this.caretTarget.classList.toggle(this.rotateClass)
  }
}
