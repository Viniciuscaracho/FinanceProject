import {Controller} from '@hotwired/stimulus';

export default class extends Controller {
  connect() {
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
      searchForm.addEventListener('submit', async (event) => {
        const textSearch = document.getElementById('textSearch').value;
        const url = searchForm.getAttribute('action');
        window.open(`${url}${textSearch.trim()}`);

      });
    }
  }

}
