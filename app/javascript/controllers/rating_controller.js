import {Controller} from "@hotwired/stimulus"

const starColors = {
  'yellow': 'fill-amber-400',
  'gray': 'fill-gray-300'
};
export default class extends Controller {
  static targets = ['star', 'input', 'submitButton'];

  async connect() {
    this.submitButtonTarget.setAttribute('disabled', true);

  }

  setRating(e) {
    const rating = parseInt(e.target.dataset.rating);

    this.starTargets.forEach((star) => {
      if (parseInt(star.dataset.rating) <= rating) {
        star.classList.remove(starColors['gray']);
        star.classList.add(starColors['yellow']);
      } else {
        star.classList.remove(starColors['yellow']);
        star.classList.add(starColors['gray']);
      }
    });

    this.inputTarget.value = rating;
    this.updateSubmitButtonState();
  }

  updateSubmitButtonState() {
    const starsSelected = this.starTargets.some(star => star.classList.contains(starColors['yellow']));
    const button = this.submitButtonTarget

    if (starsSelected) {
      button.removeAttribute('disabled');
    } else {
      button.setAttribute('disabled', true);
    }
  }
}