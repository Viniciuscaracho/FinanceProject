import {Controller} from "@hotwired/stimulus"

// Connects to data-controller="statement-item"
export default class extends Controller {
  static targets = ['amountCents', 'removeButton', 'saveButton']
  static values = {}

  connect() {
    this.toggleRemoveButton()
  }

  remove(event) {
    const li = event.target.closest('li')

    // validate if li id contains new_transaction_*
    if (li.id.startsWith('new_transaction_')) {
      this.removeNewTransaction(li)
    } else {
      this.removeExistingTransaction(li)
    }
    this.toggleRemoveButton()
    this.recalculate()
  }

  removeNewTransaction(li) {
    li.remove()
  }

  removeExistingTransaction(li) {
    const input = li.querySelector('input[name*="[_destroy]"]')
    input.disabled = false
    li.classList.add('hidden')
  }

  toggleRemoveButton() {
    const count = this.removeButtonTargets.filter((button) => {
      const li = button.closest('li')
      return li && !li.classList.contains('hidden')
    }).length

    if (count > 2) {
      this.removeButtonTargets.forEach((button) => {
        button.disabled = false
      })
    } else {
      this.removeButtonTargets.forEach((button) => {
        button.disabled = true
      })
    }
  }

  recalculate() {
    this.element.requestSubmit()
  }

  toggleSaveButton(event) {
    const saveButton = this.saveButtonTarget
    saveButton.disabled = !saveButton.disabled

  }
}
