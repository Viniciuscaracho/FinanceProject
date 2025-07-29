import CheckboxSelectAll from 'stimulus-checkbox-select-all'
import {destroy, get, put} from "@rails/request.js"

export default class extends CheckboxSelectAll {
  static targets = ['panelAction', 'totalSum']
  static values = {
    suspend: Boolean,
    balance: Number,
    sumUrl: String,
    deleteUrl: String,
    moveToUrl: String,
    transactionType: String,
    markAsPaidUrl: String,
    updateUrl: String,
    duplicateUrl: String
  }

  get checkedValues() {
    return this.checked.filter(element => !element.disabled).map((element) => element?.value)
  }

  async connect() {
    super.connect()
  }

  disconnect() {
    this.checked.forEach((value) => {
      value.checked = false
    })
    super.disconnect()
  }

  async toggle(e) {
    super.toggle(e)
    if (!this.suspendValue) {
      await this.toggleMenu()
      await this.sum()
    }
  }

  async refresh() {
    super.refresh()
    if (!this.suspendValue) {
      await this.toggleMenu()
      await this.sum()
    }
  }

  async toggleMenu() {
    if (this.checked && this.checked.length > 0) {
      this.panelActionTarget.classList.remove('hidden')
      this.totalSumTarget.classList.remove('hidden')
    } else {
      this.panelActionTarget.classList.add('hidden')
      this.totalSumTarget.classList.add('hidden')
    }
  }

  async bulkDestroy() {

    let body = new FormData
    body.append("transaction_type", this.transactionTypeValue)

    this.checkedValues.forEach((checkedValue) => {
      body.append("transaction_ids[]", checkedValue)
    })

    await destroy(`${this.deleteUrlValue}`, {
      body: body,
      responseKind: "turbo-stream"
    })

    this.panelActionTarget.classList.add('hidden')
    this.checked.forEach((value) => {
      value.checked = false
    })
  }

  async bulkMoveTo() {
    // get options to move to from the form
    let url = new URL(this.moveToUrlValue)

    this.checkedValues.forEach((checkedValue) => {
      url.searchParams.append("transaction_ids[]", checkedValue)
    })

    await get(url.toString(), {
      responseKind: "turbo-stream"
    })
  }

  async bulkMarkAsPaid() {
    let ids = this.checkedValues

    ids.forEach((id) => {
      let element = document.getElementById(`toggle_transaction_${id}`)

      if (element) {
        element.classList.add('toggle--active')
      }
    })

    let body = new FormData
    ids.forEach((id) => {
      body.append("transaction_ids[]", id)
    })


    await put(`${this.markAsPaidUrlValue}`, {
      body: body,
      responseKind: "turbo-stream"
    })

    this.panelActionTarget.classList.add('hidden')
    this.checked.forEach((value) => {
      value.checked = false
    })
  }

  async bulkUpdate() {
    // get options to move to from the form
    let url = new URL(this.updateUrlValue)

    this.checkedValues.forEach((checkedValue) => {
      url.searchParams.append("transaction_ids[]", checkedValue)
    })

    await get(url.toString(), {
      responseKind: "turbo-stream"
    })
  }

  async bulkDuplicate() {
    let body = new FormData
    this.checkedValues.forEach((checkedValue) => {
      body.append("transaction_ids[]", checkedValue)
    })

    await put(`${this.duplicateUrlValue}`, {
      body: body,
      responseKind: "turbo-stream"
    })

    this.panelActionTarget.classList.add('hidden')
    this.checked.forEach((value) => {
      value.checked = false
    })
  }

  async sum() {
    if (this.checkedValues?.length === 0) return
    let body = new FormData()
    this.checkedValues.forEach(value => body.append("transaction_ids[]", value))

    await put(`${this.sumUrlValue}`, {
      body: body,
      responseKind: "turbo-stream"
    })
  }
}
