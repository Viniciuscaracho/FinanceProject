import {Controller} from "@hotwired/stimulus"

export default class extends Controller {
    static targets = [ 'checkbox', 'count']
    connect() {
        this.replaceCount()

    }

    replaceCount(){
        if (this.countFilters() === 0) {
            this.countTarget.classList.add('hidden')
        } else {
            this.countTarget.classList.remove('hidden')
            this.countTarget.innerHTML = this.countFilters()
        }
    }


    countFilters() {
        return this.checkboxTargets.filter(checkbox => checkbox.checked).length
    }


}
