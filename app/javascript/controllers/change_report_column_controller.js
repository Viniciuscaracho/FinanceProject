import {Controller} from "@hotwired/stimulus"

export default class extends Controller {
  static targets =
    [
      'selectField', 'paidColumn',
      'dateColumn', 'descriptionColumn',
      'categoryColumn', 'costCenterColumn',
      'documentNumberColumn', 'paymentMethodColumn',
      'amountColumn', 'balanceColumn', 'contactColumn',
      'originColumn', 'transferToColumn'
    ]


  connect() {
    console.log('connected')
    console.log(this.paidColumnTarget)
    console.log(this.selectFieldTarget)
    this.changeColumnVisibility()


  }

  changeColumnVisibility() {

    let selectedValues = this.selectFieldTarget.selectedOptions

    let array = Array.from(selectedValues).map((el) => el.value)


    this.hideColumn(this.paidColumnTargets, !array.includes('paid'))
    this.hideColumn(this.dateColumnTargets, !array.includes('date'))
    this.hideColumn(this.descriptionColumnTargets, !array.includes('description'))
    this.hideColumn(this.categoryColumnTargets, !array.includes('category'))
    this.hideColumn(this.costCenterColumnTargets, !array.includes('cost_center'))
    this.hideColumn(this.documentNumberColumnTargets, !array.includes('document_number'))
    this.hideColumn(this.paymentMethodColumnTargets, !array.includes('payment_method'))
    this.hideColumn(this.amountColumnTargets, !array.includes('amount'))
    this.hideColumn(this.balanceColumnTargets, !array.includes('balance'))
    this.hideColumn(this.contactColumnTargets, !array.includes('contact'))
    this.hideColumn(this.originColumnTargets, !array.includes('origin'))
    this.hideColumn(this.transferToColumnTargets, !array.includes('transfer_to'))


  }

  hideColumn(targets, bool) {
    targets.forEach((target) => {
      target.hidden = bool
    })
  }

}
