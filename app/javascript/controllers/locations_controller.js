import {Controller} from "@hotwired/stimulus"
import {get} from "@rails/request.js"

export default class extends Controller {
  static targets = ["selectCountry", "selectState", "selectCity"]
  static values = {
    url: String
  }

  connect() {
    if (this.selectStateTarget.id === "") {
      this.selectStateTarget.id = Math.random().toString(36)
    }
    if (this.selectCityTarget.id === "") {
      this.selectCityTarget.id = Math.random().toString(36)
    }
  }

  async loadStates(event) {
    let params = new URLSearchParams()
    params.append("country", event.target.selectedOptions[0].value)
    params.append("target", this.selectStateTarget.id)

    await get(`${this.urlValue}?${params}`, {
      responseKind: "turbo-stream"
    })
  }

  async loadCities(event) {
    console.log(event)
    let params = new URLSearchParams()
    params.append("country", this.selectCountryTarget.selectedOptions[0].value)
    params.append("state", event.target.selectedOptions[0].value)
    params.append("target", this.selectCityTarget.id)

    await get(`${this.urlValue}?${params}`, {
      responseKind: "turbo-stream"
    })
  }
}