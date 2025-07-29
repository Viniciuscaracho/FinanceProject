import {Controller} from "@hotwired/stimulus"
import SlimSelect from 'slim-select'
import {get} from '@rails/request.js'

export default class extends Controller {
  static values = {
    allowDeselect: {type: Boolean, default: true},
    placeholder: {type: String, default: ''},
    closeOnSelect: {type: Boolean, default: true},
    hideSelected: {type: Boolean, default: false},
    searchUrl: {type: String, default: ''},
    searchParams: {type: Object, default: {}},
    searchMinLength: {type: Number, default: 3},
    searchMinLengthMessage: {type: String, default: 'Pesquisa deve ter pelo menos 2 caracteres...'},
    searchMessage: {type: String, default: 'Pesquisando...'},
    searchText: {type: String, default: 'Pesquise...'},
    searchPlaceholder: {type: String, default: 'Pesquisar...'}

  }

  async connect() {
    this.searchRecords = this.searchRecords.bind(this)

    this.select = new SlimSelect({
      select: this.element,
      settings: {
        allowDeselect: this.allowDeselectValue,
        placeholderText: this.placeholderValue,
        searchingText: this.searchMessageValue,
        searchText: this.searchTextValue,
        searchPlaceholder: this.searchPlaceholderValue,
        closeOnSelect: this.closeOnSelectValue,
        hideSelected: this.hideSelectedValue,
      },
      events: {
        search: this.searchRecords
      }
    })
  }

  async searchRecords(search, currentData) {
    if (search.length < this.searchMinLengthValue) return [currentData]

    const params = new URLSearchParams()
    params.append("q", search)
    // (this.searchParamsValue || {}).forEach((param) => params.append(param.name, param.value))

    const response = await get(this.searchUrlValue, {
      query: params,
      responseKind: 'json'
    })

    if (!response.ok) return Promise.resolve([])

    const data = await response.json

    return Promise.resolve([
      ...(data || []).map((record) => ({text: record.text, value: `${record.value}`}))
    ])
  }

  disconnect() {
    this.select.destroy()
  }
}
