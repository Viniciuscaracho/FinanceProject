import {Controller} from "@hotwired/stimulus"
import {leave, toggle} from 'el-transition'

export default class extends Controller {
  static targets = ['accountType', 'accountName']

  async connect() {
    if (this.accountTypeTarget.value === 'personal') {
      await leave(this.accountNameTarget)
    }
  }

  async changeAccountType(e) {
    await toggle(this.accountNameTarget)
  }
}
