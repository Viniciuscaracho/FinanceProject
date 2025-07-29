import {Controller} from "@hotwired/stimulus"

export default class extends Controller {
    static targets = [ 'checkbox', 'input' ]
    connect() {

    }

    clean(){
        this.checkboxTargets.forEach(checkbox => {
            checkbox.checked = false
            checkbox.dispatchEvent(new Event('change'))
        })
    }


}
