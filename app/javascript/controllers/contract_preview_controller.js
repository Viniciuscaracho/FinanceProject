// Controller class for managing dynamic content and interactions.
import {Controller} from "@hotwired/stimulus";
import {debounce} from "lodash";
import {post} from "@rails/request.js";

export default class extends Controller {
  // Define targets and values for Stimulus controller.
  static targets = ["header", "pages"];
  static values = {
    showHeader: Boolean,
    contactUrl: String,
    contactId: String
  };

  // Connect method called when the controller is initialized.
  connect() {
    super.connect();

    // Set up debounced input handler.
    this.handleInputDebounced = debounce(this.handleInput.bind(this), 400);

    // Cache elements for efficiency.
    this.cacheElements();

    // Initial content setup.
    this.setupContent();

    // Rebuild and replace inputs on Turbo Frame load event.
    document.addEventListener('turbo:load', () => {
      this.setupContent();
    });

    // Attach change event listener to checkbox for sending content to contact.
    document.getElementById('save_on_contact').addEventListener('change', this.sendToContact.bind(this));
  }

  // Cache frequently used elements.
  cacheElements() {
    this.contentTemplate = document.getElementById('template');
    this.content = this.contentTemplate.querySelector('#content');
    this.pages = document.getElementById('pages');
  }

  // Set up initial content and replace inputs.
  setupContent() {
    this.rebuild(this.showHeaderValue);
    this.replaceInputs();
  }

  // Replace headings in the content with specified classes.
  replaceHeadings() {
    const headings = this.content.querySelectorAll('h1, h2, h3');

    const headingClasses = {
      H1: ['text-4xl', 'font-bold', 'print:text-7xl', 'leading-[1]'],
      H2: ['text-[28px]', 'font-bold', 'print:text-5xl', 'leading-[1]'],
      H3: ['text-2xl', 'font-bold', 'print:text-[44px]', 'leading-[1]'],
    };

    headings.forEach((heading) => {
      const nodeName = heading.nodeName;
      this.replaceHeading(heading, headingClasses[nodeName]);
    });
  }

  // Replace a heading node with a new paragraph node with specified classes.
  replaceHeading(node, classes) {
    const newNode = document.createElement('p');
    newNode.classList.add(...classes);
    newNode.textContent = node.textContent;
    newNode.style.textAlign = node.style.textAlign;
    node.replaceWith(newNode);
  }

  // Replace input elements with span elements for styling.
  replaceInputs() {
    const inputs = this.pages.querySelectorAll('input');

    if (inputs.length > 0) {
      this.inputs = inputs;
      inputs.forEach((input, index) => this.replaceInput(input, index));

      const inputsTemplate = this.contentTemplate.querySelectorAll('input');
      inputsTemplate.forEach((input, index) => this.replaceInput(input, index));
    } else {
      this.contentTemplate.querySelectorAll('span[id^="input_"]').forEach((span, index) => this.replaceInputTemplate(span, index));
    }
  }

  // Replace an input node with a styled span node.
  replaceInput(node, index) {
    const newNode = document.createElement('span');
    this.setStyleAndAttributes(newNode, node, index);

    newNode.addEventListener('blur', this.handleInputDebounced.bind(this, newNode, index));
    node.replaceWith(newNode);
  }

  // Handle input changes and update the template accordingly.
  handleInput(node, index) {
    this.replaceInputTemplate(node, index);
    this.sendToContact()
  }

  // Check if an element is in a NodeList.
  isElementInNodeList(targetElement, nodeList) {
    return Array.from(nodeList).includes(targetElement);
  }

  // Replace the input template with the actual input content.
  replaceInputTemplate(node, index) {
    this.contentTemplate.querySelectorAll(`#input_${index}`).forEach((input) => {
      input.textContent = node.textContent;
    });

    const currentElement = document.activeElement;

    if (!this.isElementInNodeList(currentElement, this.inputs)) {
      this.rebuild(this.showHeaderValue);
    }

    this.inputs = this.pages.querySelectorAll('span[id^="input_"]');
    this.inputs.forEach((span, idx) => {
      span.addEventListener('blur', this.handleInputDebounced.bind(this, span, idx));
    });
  }

  // Rebuild the content into pages with specified height.
  rebuild(showHeader = false) {
    this.showContentTemplate();
    const contentTarget = this.content;
    const headerTarget = this.contentTemplate.querySelector('#header');

    this.replaceHeadings();

    const heightMAX = 750;
    const nodes = Array.from(contentTarget.childNodes);
    const pagesContent = [];

    const headerHeight = () => headerTarget.getBoundingClientRect().height;
    const headerHidden = () => {
      headerTarget.classList.add('hidden');
      return headerHeight();
    }
    const headerNotHidden = () => {
      headerTarget.classList.remove('hidden');
      return 0;
    };

    const height = () => nodes.reduce((sum, node) => sum + Math.ceil(parseFloat(node.getBoundingClientRect().height)), 0);
    const pages = Math.ceil((height() + (showHeader ? headerNotHidden() : headerHidden())) / heightMAX);
    nodes.unshift(headerTarget);

    for (let i = 0; i < pages; i++) {
      const page = [];
      let height = 0;

      while (height < heightMAX && nodes.length > 0) {
        if (height + nodes[0].getBoundingClientRect().height > heightMAX) {
          const originalNode = nodes.shift();
          const newNode = originalNode.cloneNode(true);
          newNode.textContent = '';
          const wordArray = originalNode.textContent.split(' ');
          originalNode.textContent = '';

          for (const word of wordArray) {
            originalNode.textContent += word + ' ';

            if (height + originalNode.getBoundingClientRect().height > heightMAX) {
              height += originalNode.getBoundingClientRect().height;
              const words = originalNode.textContent.trim().split(' ');
              words.pop();
              originalNode.textContent = words.join(' ');
              const overflowWords = wordArray.slice(words.length);

              page.push(originalNode);

              if (originalNode.textContent.trim() === '') {
                originalNode.remove();
              }

              if (overflowWords.length > 0) {
                newNode.textContent = overflowWords.join(' ');
                contentTarget.insertBefore(newNode, nodes[0]);
                nodes.unshift(newNode);
              }
              break;
            }
          }
        } else {
          const node = nodes.shift();
          page.push(node);
          height += node.getBoundingClientRect().height;
        }
      }
      pagesContent.push(page);
    }

    this.hideContentTemplate();
    this.updatePages(pagesContent);
  }

  // Show the content template.
  showContentTemplate() {
    this.contentTemplate.classList.remove('hidden');
  }

  // Hide the content template.
  hideContentTemplate() {
    this.contentTemplate.classList.add('hidden');
  }

  // Update the pages with the generated HTML.
  updatePages(pagesContent) {
    const pagesHTML = pagesContent.map((page) => page.map((node) => node.outerHTML).join(''));
    const pagesDiv = this.pagesTarget;
    pagesDiv.innerHTML = '';

    for (let i = 0; i < pagesHTML.length; i++) {
      const page = `<div class="bg-white my-8 mx-16 drop-shadow-lg overflow-hidden print:overflow-visible print:break-inside-avoid w-[655px] h-[840px] print:w-[980px] print:h-[1400px] print:drop-shadow-none">
                <div class="overflow-visible print:w-[980px]  my-8 mx-16 h-full print:font-sans print:my-0 print:mx-0 print:py-0 print:overflow-visible print:drop-shadow-none print:leading-8">
                    ${pagesHTML[i]}
                </div>
            </div>`;
      pagesDiv.insertAdjacentHTML('beforeend', page);
    }
  }

  // Send content to the contact if the checkbox is checked.
  async sendToContact() {
    if (!document.getElementById('save_on_contact').checked) {
      return;
    }

    let content = this.content.innerHTML;
    let contract_template_id = this.contentTemplate.dataset.contractTemplateId;

    // Use Rails request.js to send content to the specified contact URL.
    post(this.contactUrlValue, {
      responseType: 'json',
      body: JSON.stringify({
        content: content,
        contact_id: this.contactIdValue,
        contract_template_id: contract_template_id
      })
    });
  }

  // Set style and attributes for a new node based on an existing node.
  setStyleAndAttributes(newNode, originalNode, index) {
    newNode.classList.add('bg-gray-100', 'border-2', 'rounded', 'focus:outline-none', 'text-justify', 'print:bg-white', 'print:border-0', 'mx-2', 'print:leading-7', 'border-gray-300', 'focus:border-primary-500', 'input_contract');
    newNode.setAttribute('contenteditable', 'true');
    newNode.setAttribute('data-text', 'Digite aqui');
    newNode.style.textAlign = originalNode.style.textAlign;
    newNode.id = `input_${index}`;
  }
}
