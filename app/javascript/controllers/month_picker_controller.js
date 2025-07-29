import {Controller} from "@hotwired/stimulus"
import AirDatepicker from 'air-datepicker';
import localePtBR from 'air-datepicker/locale/pt-BR';
// import localeEn from 'air-datepicker/locale/en';

export default class extends Controller {
  static values = {
    locale: {type: String, default: 'pt-BR'}
  }

  connect() {
    new AirDatepicker(this.element, {
      view: 'months',
      minView: 'months',
      dateFormat: 'MMMM/yyyy',
      locale: localePtBR,
    })
  }
}
