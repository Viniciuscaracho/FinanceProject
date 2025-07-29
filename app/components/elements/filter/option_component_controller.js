import {Controller} from "@hotwired/stimulus"

export default class extends Controller {
    static targets = [ 'checkbox', 'input' ]
    connect() {
        this.toggleInput()
        this.checkboxTarget.addEventListener('change', this.toggleInput.bind(this))
    }

    toggleInput(){
        this.inputTarget.hidden = !this.checkboxTarget.checked
    }

}
