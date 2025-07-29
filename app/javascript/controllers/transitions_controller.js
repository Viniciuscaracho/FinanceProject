import {Controller} from "@hotwired/stimulus"
import {enter, leave, toggle} from 'el-transition'

export default class extends Controller {

  async connect() {
    await enter(this.element)
  }

  async disconnect() {
    await leave(this.element)
  }

  async toggle(event) {
    await toggle(this.element)
  }
}
