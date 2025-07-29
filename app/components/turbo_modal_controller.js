import { Controller } from "@hotwired/stimulus"
import { enter, leave } from 'el-transition'

// Connects to data-controller="turbo-drawer"
export default class extends Controller {
  static targets = ["backdrop", "modal"]

  async connect(){
    await this.showModal()
    super.connect()
  }

  disconnect(){
    this.enableBodyScroll()
    super.disconnect()
  }

  async showModal() {
    this.disableBodyScroll()
    await Promise.all([enter(this.backdropTarget), enter(this.modalTarget)])
  }

  // hide modal
  // action: "turbo-modal#hideModal"
  async hideModal() {
    await Promise.all([leave(this.modalTarget), leave(this.backdropTarget)])
    this.element.parentElement?.removeAttribute("src") // it might be nice to also remove the modal SRC
    this.element.remove()
    this.enableBodyScroll()
  }

  // hide modal on successful form submission
  // action: "turbo:submit-end->turbo-modal#submitEnd"
  async submitEnd(e) {
    if (e.detail.success) {
      if (e.target.tagName === 'FORM') return
      await this.hideModal()
    }
  }

  // hide modal when clicking ESC
  // action: "keyup@window->turbo-modal#closeWithKeyboard"
  async closeWithKeyboard(e) {
    if (e.code === "Escape") {
      await this.hideModal()
    }
  }

  enableBodyScroll() {
    const layout = document.body.querySelector('.layout__right')
    if (layout) layout.classList.remove('overflow-hidden')
    document.body.classList.remove('overflow-hidden')
  }

  disableBodyScroll() {
    const layout = document.body.querySelector('.layout__right')
    if (layout) layout.classList.add('overflow-hidden')
    document.body.classList.add('overflow-hidden')
  }
}
