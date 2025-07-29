import {Controller} from '@hotwired/stimulus';
import '@nobleclem/jquery-multiselect'
import {get} from "@rails/request.js"


export default class extends Controller {
  static values = {
    selectAllText: {type: String, default: 'Selecionar todos'},
    unselectAllText: {type: String, default: 'Desmarcar todos'},
    placeholder: {type: String, default: 'Todos'},
    selectedOptions: {type: String, default: ' selecionados'},
    url: {type: String, default: ''},
    selectAll: {type: Boolean, default: true},
    search: {type: Boolean, default: true}
  }

  connect() {
    this.changeElement = this.changeElement.bind(this);
    this.search = this.search.bind(this);

    this.multiselect = $(this.element).multiselect({
      selectAll: this.selectAllValue,
      search: this.searchValue,
      texts: {
        selectAll: this.selectAllTextValue,
        unselectAll: this.unselectAllTextValue,
        placeholder: this.placeholderValue,
        selectedOptions: this.selectedOptionsValue
      },
      onOptionClick: this.changeElement,
      onSelectAll: this.changeElement,
    });
  }

  changeElement(_element, _option) {
    this.element.dispatchEvent(new CustomEvent('change'));
  }

  async search(element) {
    if (!this.hasUrlValue) return

    let q = element.parentElement.querySelector('input[type="text"]').value
    if (!q) return

    let params = new URLSearchParams()
    params.append("q", q)

    let response = await get(`${this.urlValue}.json`, {
      query: params,
      responseKind: 'json'
    })

    if (response.ok) {
      let json = await response.json
      let options = json.map((item) => ({name: item.name, value: item.id}))
      $(element).multiselect('loadOptions', options);
    }
  }
}
