import {Controller} from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ['radio', 'submitButton'];

  connect() {
    this.checkRadio();
  }

  checkRadio() {
    const isAnyRadioSelected = this.radioTargets.some(radio => radio.checked);
    this.submitButtonTarget.disabled = !isAnyRadioSelected;
  }

  toggleRadio(event) {
    const clickedRadio = event.target;
    this.radioTargets.forEach(radio => {
      radio.checked = (radio === clickedRadio);
    });
    this.checkRadio();
  }
}