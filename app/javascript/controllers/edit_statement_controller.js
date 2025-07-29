import CheckboxSelectAll from 'stimulus-checkbox-select-all'
import {put} from "@rails/request.js"

// Connects to data-controller="statement-item"
export default class extends CheckboxSelectAll {
  static targets = ['dropdown']
  static values = {
    bulkConfirmUrl: String,
    bulkIgnoreUrl: String
  }

  get checkedValues() {
    return this.checked.filter(element => !element.disabled).map((element) => element?.value)
  }

  connect() {
    super.connect()
  }

  toggle(e) {
    super.toggle(e);
    this.toggleMenu()
  }

  refresh() {
    super.refresh();
    this.toggleMenu()
  }

  toggleMenu() {
    if (this.checked && this.checked.length > 0) {
      this.dropdownTarget.classList.remove('hidden')
    } else {
      this.dropdownTarget.classList.add('hidden')
    }
  }

  async bulkConfirm(event) {
    let body = new FormData()
    this.checkedValues.forEach(value => body.append("statement_item_ids[]", value))

    await put(`${this.bulkConfirmUrlValue}`, {
      body: body,
      responseKind: "turbo-stream"
    })
  }

  async bulkIgnore(event) {
    await put(`${this.bulkIgnoreUrlValue}`, {
      body: JSON.stringify({statement_item_ids: this.checkedValues}),
      responseKind: "turbo-stream"
    })
  }
}
