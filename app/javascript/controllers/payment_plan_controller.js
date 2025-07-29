import {Controller} from "@hotwired/stimulus"

// Connects to data-controller="statement-item"
export default class extends Controller {
  static targets = ['amountCents', 'numberOfInstallments', 'removeButton', 'saveButton', 'item']
  static values = {}

  connect() {
    this.toggleRemoveButton()
    this.hideAllDestroyedExistingTransactions()
  }

  remove(event) {
    const li = event.target.closest('li')
    // validate if li id contains new_transaction_*
    if (li.id.startsWith('new_transaction_')) {
      this.removeNewTransaction(li)
    } else {
      this.hideExistingTransaction(li)
    }
    this.toggleRemoveButton()
    this.recalculate()
  }

  removeNewTransaction(li) {
    li.remove()
  }

  hideExistingTransaction(li) {
    const input = li.querySelector('input[name*="[_destroy]"]')
    input.disabled = false
    li.classList.add('hidden')
  }

  hideAllDestroyedExistingTransactions() {
    this.itemTargets.forEach((item) => {
      let destroy = item.querySelector('input[name*="[_destroy]"]')
      if (destroy.disabled) return

      item.classList.add('hidden')
    })
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

  amountChanged(event) {
    console.log(event.target)
    this.setValueToChangedField('amount_cents')
    this.element.requestSubmit()
  }

  numberOfInstallmentsChanged(event) {
    console.log(event.target)
    this.setValueToChangedField('number_of_installments')
    this.element.requestSubmit()
  }

  frequencyChanged(event) {
    console.log(event.target)
    this.setValueToChangedField('frequency')
    this.element.requestSubmit()
  }

  installmentAmountChanged(event) {
    console.log(event.target)
    this.setValueToChangedField('installment_amount_cents')
    this.setInstallmentAmountCentsAsEdited(event, true)
    this.element.requestSubmit()
  }

  updateOtherInstallments(event) {
    console.log(event.target)
    this.setValueToChangedField('update_other_installments')
    this.element.requestSubmit()
  }

  installmentDueDateChanged(event) {
    console.log(event.target)
    this.setValueToChangedField('installment_due_date')
    this.setInstallmentDueDateAsEdited(event, true)
    this.element.requestSubmit()
  }

  removeInstallment(event) {
    console.log(event.target)
    this.setValueToChangedField('remove_installment')
    this.setInstallmentAsDestroyed(event)
    this.numberOfInstallmentsTarget.value = parseInt(this.numberOfInstallmentsTarget.value) - 1
    this.element.requestSubmit()
  }

  setValueToChangedField(value) {
    const el = this.element.querySelector('#changed')
    el.value = value
  }

  setValueToChangedInstallmentIndexField(value) {
    const el = this.element.querySelector('#changed_installment_index')
    el.value = value
  }

  setInstallmentAmountCentsAsEdited(event, value) {
    const amountCentsEditedElement = this.getElementFromTarget(event, 'input[name*="[_amount_cents_edited]"]')
    amountCentsEditedElement.value = value
  }

  setInstallmentDueDateAsEdited(event, value) {
    const dueDateEditedElement = this.getElementFromTarget(event, 'input[name*="[_due_date_edited]"]')
    dueDateEditedElement.value = value
  }

  setInstallmentAsDestroyed(event) {
    const destroyElement = this.getElementFromTarget(event, 'input[name*="[_destroy]"]')
    destroyElement.disabled = false
  }

  getElementFromTarget(event, selector) {
    const li = event.target.closest('li')
    return li.querySelector(selector)
  }

  recalculate() {
    this.element.requestSubmit()
  }

  toggleSaveButton(event) {
    const saveButton = this.saveButtonTarget
    saveButton.disabled = !saveButton.disabled

  }
}
