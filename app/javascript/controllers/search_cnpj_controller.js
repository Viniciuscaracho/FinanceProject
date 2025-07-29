import {Controller} from "@hotwired/stimulus"
import {get} from "@rails/request.js";

export default class extends Controller {
  static values = {url: String}

  static targets = ["cnpj", "button"]

  connect() {
    this.toggleCnpj = this.toggleCnpj.bind(this)
    this.cnpjTarget.addEventListener("input", this.toggleCnpj)
    this.toggleCnpj()
  }

  disconnect() {
    super.disconnect();
    this.cnpjTarget.removeEventListener("input", this.toggleCnpj)
  }

  toggleCnpj() {
    const value = this.cnpjTarget.value.replaceAll(/\D/g, "")
    this.buttonTarget.disabled = value.length < 14
  }

  async search() {
    this.buttonTarget.disabled = true
    const formData = new FormData(this.buttonTarget.form);
    await get(this.urlValue, {query: formData, responseKind: "turbo-stream"})
    this.buttonTarget.disabled = false
  }
}
