
import Trix from 'trix';
import './toolbar'
import './trix_config'

window.Trix = Trix;

document.addEventListener('trix-initialize', updateToolbars, { once: true });

function updateToolbars(event) {
console.log(Trix.config)
    const toolbars = document.querySelectorAll('trix-toolbar');
    const html = Trix.config.toolbar.getDefaultHTML();
    toolbars.forEach((toolbar) => (toolbar.innerHTML = html));
}


class BaseElement extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
}

function innerHTML(alignment) {
    return `
    
        <style>
          :host {
            text-align: ${alignment};
            width: 100%;
            display: block;
          }
        </style>

    <slot> </slot>
  `;
}

export class AlignLeftElement extends BaseElement {
    constructor() {
        super();

        this.shadowRoot.innerHTML = innerHTML('left');
    }
}

export class AlignCenterElement extends BaseElement {
    constructor() {
        super();

        this.shadowRoot.innerHTML = innerHTML('center');
    }
}

export class AlignRightElement extends BaseElement {
    constructor() {
        super();

        this.shadowRoot.innerHTML = innerHTML('right');
    }
}


window.customElements.define('align-left', AlignLeftElement);
window.customElements.define('align-center', AlignCenterElement);
window.customElements.define('align-right', AlignRightElement);


