import {Controller} from "@hotwired/stimulus"

export default class extends Controller {
  connect() {

    let content = document.getElementById("content_primary")
    let content_secondary = document.getElementById("content_secondary")

    content.addEventListener("input", () => {
      content_secondary.innerHTML = content.innerHTML
    })

    content_secondary.addEventListener("input", () => {
      content.innerHTML = content_secondary.innerHTML
    })

  }
}