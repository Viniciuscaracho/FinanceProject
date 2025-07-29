import {Controller} from "@hotwired/stimulus"
import {enter, leave} from 'el-transition'

// Connects to data-controller="transactions"
export default class extends Controller {
  static targets = ["newTransaction"]
  static values = {
    resetPath: String
  }

  async connect() {
    await enter(this.newTransactionTarget)
  }

  // hide modal
  // action: "turbo-modal#hideModal"
  async hideNewTransaction() {
    await leave(this.newTransactionTarget)
    this.element.parentElement?.removeAttribute("src") // it might be nice to also remove the modal SRC
    this.element.remove()
  }

  // hide modal on successful form submission
  // action: "turbo:submit-end->turbo-modal#submitEnd"
  async submitEnd(e) {
    if (e.detail.success) {
      await this.hideDrawer()
    }
  }

  // hide modal when clicking ESC
  // action: "keyup@window->turbo-modal#closeWithKeyboard"
  async closeWithKeyboard(e) {
    if (e.code === "Escape") {
      await this.hideDrawer()
    }
  }

  // hide modal when clicking outside of modal
  // action: "click@window->turbo-modal#closeBackground"
  async closeBackground(e) {
    if (this.element.contains(e.target))
      return;
    await this.hideDrawer()
  }
}
