import {Controller} from "@hotwired/stimulus"

// Connects to data-controller="statement-item"
export default class extends Controller {
  static targets = ["contact", "category", "bankAccount", "transferTo", "confirmButton"]
  static values = {type: String, bankAccount: String}

  connect() {
  }

  changeTransactionType(event) {
    const element = event.target
    const value = element.options[element.selectedIndex].value

    if (value === 'transfer') {
      this.showTransferFields()
    } else {
      this.hideTransferFields()
    }

    this.toggleConfirmButton(value)
  }

  enableCheckbox(value) {

  }

  toggleConfirmButton(value) {
    this.confirmButtonTarget.disabled = value === '';
  }

  showTransferFields() {
    this.contactTarget.slim.setSelected('')
    this.contactTarget.slim.disable()
    this.contactTarget.classList.add('hidden')

    this.categoryTarget.slim.setSelected('')
    this.categoryTarget.slim.disable()
    this.categoryTarget.classList.add('hidden')

    if (this.typeValue === 'credit') {
      this.transferToTarget.slim.setSelected(this.bankAccountValue)
    } else {
      this.bankAccountTarget.slim.setSelected(this.bankAccountValue)
    }

    this.bankAccountTarget.classList.remove('hidden')
    this.transferToTarget.classList.remove('hidden')
  }

  hideTransferFields() {
    this.contactTarget.slim.enable()
    this.categoryTarget.slim.enable()

    this.contactTarget.classList.remove('hidden')
    this.categoryTarget.classList.remove('hidden')

    this.bankAccountTarget.slim.setSelected('')
    this.bankAccountTarget.slim.disable()
    this.bankAccountTarget.classList.add('hidden')

    this.transferToTarget.slim.setSelected('')
    this.transferToTarget.slim.disable()
    this.transferToTarget.classList.add('hidden')
  }
}
