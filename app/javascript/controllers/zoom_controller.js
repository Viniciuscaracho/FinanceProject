import {Controller} from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["div", "slider", 'percentage']

  connect() {

    this.updatePercentage()
    this.changeZoom()
    this.setAlignment()
    this.sliderTarget.addEventListener('input', this.updatePercentage.bind(this))
    this.sliderTarget.addEventListener('input', this.changeZoom.bind(this))
    document.addEventListener('editor-change', this.setAlignment.bind(this))
    document.addEventListener('editor-change', this.changeZoom.bind(this))

  }

  updatePercentage(event) {
    this.percentageTarget.innerHTML = `${parseInt(this.sliderTarget.value * 100)}%`
  }

  changeZoom(event) {
    this.divTargets.forEach((div) => {
      div.style.zoom = `${this.sliderTarget.value}`
    })

  }

  setAlignment() {

    this.divTarget.classList.add('snap-center')

    setTimeout(() => {
      this.divTarget.classList.remove('snap-center')
    }, 1000)

  }
}