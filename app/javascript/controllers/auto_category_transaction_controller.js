import {Controller} from "@hotwired/stimulus"
import {get} from "@rails/request.js"

export default class extends Controller {
  static targets = ['contact', 'category']

  static values = {
    url: String,
    newTransaction: Boolean
  }

  connect() {
    super.connect()
    this.abortController = null
    this.onContactChanged = this.onContactChanged.bind(this)
    this.addEvent()
  }

  disconnect() {
    super.disconnect()
    this.removeEvent()
  }

  removeEvent() {
    if (!this.newTransactionValue) return

    this.abortIfRequestInProgress()
    this.contactTarget.removeEventListener('change', this.onContactChanged)
  }

  addEvent() {
    if (!this.newTransactionValue) return

    this.contactTarget.addEventListener('change', this.onContactChanged)
  }

  async onContactChanged(_event) {
    this.abortIfRequestInProgress()
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    // build params
    const formData = new FormData(this.element)
    const params = new URL(this.urlValue)

    formData.forEach((value, key) => {
      params.searchParams.append(key, value);
    });

    try {
      await get(params.href, {
        responseKind: 'turbo-stream', signal
      })
    } catch (error) {
      console.log(error)
    } finally {
      this.abortController = null
    }
  }

  abortIfRequestInProgress() {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }

}
