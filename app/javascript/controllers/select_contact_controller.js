import {Controller} from "@hotwired/stimulus"
import SlimSelect from 'slim-select'
import {get, post} from '@rails/request.js'

export default class extends Controller {
  static values = {
    allowDeselect: {type: Boolean, default: true},
    placeholder: {type: String, default: ''},
    createUrl: {type: String, default: '/contacts'},
    searchUrl: {type: String, default: '/contacts.json'},
    searchMinLength: {type: Number, default: 2},
    searchMinLengthMessage: {type: String, default: 'Search must be at least 2 characters'},
    searchMessage: {type: String, default: 'Searching...'},
    searchText: {type: String, default: 'search a contact or add a new one...'},
    searchPlaceholder: {type: String, default: 'Search'}
  }

  async connect() {
    this.addContact = this.addContact.bind(this)
    this.searchContacts = this.searchContacts.bind(this)

    this.select = new SlimSelect({
      select: this.element,
      settings: {
        allowDeselect: this.allowDeselectValue,
        placeholderText: this.placeholderValue,
        searchingText: this.searchMessageValue,
        searchText: this.searchTextValue,
        searchPlaceholder: this.searchPlaceholderValue,
        closeOnSelect: true,
        hideSelected: false,
      },
      events: {
        addable: this.addContact,
        search: this.searchContacts
      }
    })
  }

  async addContact(value) {
    const response = await post(this.createUrlValue, {
      body: {
        contact: {
          name: value
        }
      },
      responseKind: 'json'
    })

    if (!response.ok) return false

    const contact = await response.json

    return {text: contact.name, value: `${contact.id}`}
  }

  async searchContacts(search, currentData) {
    if (search.length === 0) return [currentData]
    if (search.length < this.searchMinLengthValue) return await Promise.reject(this.searchMinLengthMessageValue)

    const params = new URLSearchParams()
    params.append("q", search)

    const response = await get(this.searchUrlValue, {
      query: params,
      responseKind: 'json'
    })

    if (!response.ok) return []

    const data = await response.json

    return [
      ...data.map((contact) => ({text: contact.name, value: `${contact.id}`}))
    ]
  }

  disconnect() {
    this.select.destroy()
  }
}
