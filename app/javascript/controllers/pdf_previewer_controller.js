import {Controller} from "@hotwired/stimulus"

// Connects to data-controller="statement-item"
export default class extends Controller {
  static values = {url: String, fileName: String, clientId: String}

  connect() {
    const config = {
      content: {
        location: {
          url: this.urlValue
        }
      },
      metaData: {
        fileName: `${this.fileNameValue}`
      }
    }
    const settings = {embedMode: "SIZED_CONTAINER", defaultViewMode: "FIT_PAGE"}
    const adobeDCView = new AdobeDC.View({clientId: `${this.clientIdValue}`, divId: this.element.id})
    adobeDCView.previewFile(config, settings)
  }
}
