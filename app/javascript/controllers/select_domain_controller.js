import {Controller} from "@hotwired/stimulus"
import SlimSelect from 'slim-select'
import {post} from '@rails/request.js'

export default class extends Controller {
  static values = {
    allowDeselect: {type: Boolean, default: false},
    placeholder: {type: String, default: ''},
    url: {type: String, default: ''},
    modelName: String,
    transactionType: String,
    searchText: {type: String, default: 'Search or add a new one...'},
    searchPlaceholder: {type: String, default: 'Search'}
  }

  async connect() {
    this.addDomain = this.addDomain.bind(this)

    this.select = new SlimSelect({
      select: this.element,
      settings: {
        allowDeselect: this.allowDeselectValue,
        placeholderText: this.placeholderValue,
        searchText: this.searchTextValue,
        searchPlaceholder: this.searchPlaceholderValue,
        closeOnSelect: true,
        hideSelected: false,
      },
      events: {
        addable: this.addDomain
      }
    })
  }

  async addDomain(value) {
    const body = {}
    body[this.modelNameValue] = {
      name: value,
      transaction_type: (this.hasTransactionTypeValue) ? this.transactionTypeValue : null
    }

    const response = await post(this.urlValue, {
      body: body,
      responseKind: 'json'
    })

    if (!response.ok) return false

    const domain = await response.json

    return {text: domain.name, value: `${domain.id}`}
  }

  disconnect() {
    this.select.destroy()
  }
}
