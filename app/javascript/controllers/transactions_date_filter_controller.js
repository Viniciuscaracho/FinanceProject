import {Controller} from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["select", "rangeFilter"]

  connect() {
    this.toggleRangeFilter()
  }

  toggleRangeFilter(event) {
    if (this.selectTarget.value == "range") {
      this.rangeFilterTarget.classList.remove("hidden")
    } else {
      this.rangeFilterTarget.classList.add("hidden")
    }
  }
}
