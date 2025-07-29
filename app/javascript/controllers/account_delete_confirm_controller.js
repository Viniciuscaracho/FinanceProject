import {Controller} from "@hotwired/stimulus"

export default class extends Controller {

  static targets = ["button"]

  connect() {
    console.log("connected")
    console.log(this.buttonTarget)
  }

  confirm(event) {
    if (event.target.value === "DELETE" || event.target.value === "DELETAR") {
      document.getElementById("submit_destroy_account").disabled = false
    } else {
      document.getElementById("submit_destroy_account").disabled = true
    }
  }

  disconnect() {

  }
}
