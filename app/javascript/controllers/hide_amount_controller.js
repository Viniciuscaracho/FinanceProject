import {Controller} from "@hotwired/stimulus"
import {patch} from "@rails/request.js"

export default class extends Controller {
  static targets = ['button', 'amountField']

  static values = {
    initial: Boolean,
    button: Boolean,
    url: String
  }

  async toggleUserVisible() {
    await patch(this.urlValue, {
      responseKind: 'turbo-stream'
    })
  }

  amountFieldTargetConnected(target) {
    const currentValue = !this.initialValue;

    if (currentValue) {
      this.hideField(target);
    } else {
      this.showField(target);
    }
  }

  connect() {
  }

  toggleVisible() {
    const button = this.buttonTarget;
    const currentValue = button.dataset.value;
    this.initialValue = currentValue === 'true'

    if (currentValue === "true") {
      button.value = "false";
      this.showFields();

    } else {
      button.value = "true";
      this.hideFields();
    }

    this.toggleUserVisible();
  }

  hideFields() {
    this.amountFieldTargets.forEach(this.hideField);
  }

  hideField(field) {
    field.classList.add("blur-md");
    field.classList.add("select-none")
  }

  showFields() {
    this.amountFieldTargets.forEach(this.showField);
  }

  showField(field) {
    field.classList.remove("blur-md");
    field.classList.remove("select-none");
  }
}