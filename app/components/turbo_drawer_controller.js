import { Controller } from "@hotwired/stimulus"
import { enter, leave } from 'el-transition'

// Connects to data-controller="turbo-drawer"
export default class extends Controller {
  static targets = ["drawer"]

  async connect(){
    await enter(this.drawerTarget)
    document.body.classList.add('overflow-hidden')
  }
  // hide modal
  // action: "turbo-modal#hideModal"
  async hideDrawer() {
    await leave(this.drawerTarget)
    this.element.parentElement?.removeAttribute("src") // it might be nice to also remove the modal SRC
    this.element.remove()
    document.body.classList.add('overflow-y-auto')
  }
  // hide modal on successful form submission
  // action: "turbo:submit-end->turbo-modal#submitEnd"
  async submitEnd(e) {
    if (e.detail.success) {
      // if (this.element.contains(e.target))
      //   return
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
    const datePickerContainer = document.body.querySelector('.air-datepicker.-active-')
    const confirmModal = document.body.querySelector('#confirm-modal')
    const ssContent = document.body.querySelector('.ss-content.ss-open-above, .ss-content.ss-open-below')

    if (this.element.contains(e.target) || ssContent?.contains(e.target) || datePickerContainer?.contains(e.target) || confirmModal?.contains(e.target))
      return;
    await this.hideDrawer()
  }
}
