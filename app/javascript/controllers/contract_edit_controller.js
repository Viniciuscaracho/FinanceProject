import {Controller} from "@hotwired/stimulus";
import {debounce} from "lodash";
import {post} from "@rails/request.js";

export default class extends Controller {
  static targets = ["header", "pages"];
  static values = {
    showHeader: Boolean,
    contactUrl: String,
    contactId: String
  };

  connect() {
    super.connect();
    this.handleInputDebounced = debounce(this.handleInput.bind(this), 1000);

    this.contentTemplate = document.getElementById('template');
    this.content = this.contentTemplate.querySelector('#content');
    this.pages = document.getElementById('pages');

    this.rebuild(this.showHeaderValue);
    this.replaceInputs();

    document.addEventListener('turbo:load', () => {
      this.rebuild(this.showHeaderValue);
      this.replaceInputs();
    });

    document.getElementById('save_on_contact').addEventListener('change', this.sendToContact.bind(this));

  }

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

  replaceHeading(node, classes) {
    const newNode = document.createElement('p');
    newNode.classList.add(...classes);
    newNode.textContent = node.textContent;
    newNode.style.textAlign = node.style.textAlign;
    node.replaceWith(newNode);
  }

  replaceInputs() {
    const inputs = this.pages.querySelectorAll('input');

    if (inputs.length > 0) {
      inputs.forEach((input, index) => this.replaceInput(input, index));

      const inputsTemplate = this.contentTemplate.querySelectorAll('input');
      inputsTemplate.forEach((input, index) => this.replaceInput(input, index));


    } else {
      this.contentTemplate.querySelectorAll('span[id^="input_"]').forEach((span, index) => this.replaceInputTemplate(span, index));
    }
  }

  isElementInNodeList(targetElement, nodeList) {

    for (let i = 0; i < nodeList.length; i++) {
      if (nodeList[i] === targetElement) {
        return true;
      }
    }
    return false;
  }

  replaceInput(node, index) {
    const newNode = document.createElement('span');
    newNode.classList.add('bg-gray-100', 'border-2', 'rounded', 'focus:outline-none', 'text-justify', 'print:bg-white', 'print:border-0', 'mx-2', 'print:leading-6', 'border-primary-500', 'input_contract');
    newNode.setAttribute('contenteditable', 'true');
    newNode.setAttribute('data-text', 'Digite aqui');
    // newNode.textContent =
    newNode.style.textAlign = node.style.textAlign;
    newNode.id = `input_${index}`;
    node.replaceWith(newNode);

    newNode.addEventListener('blur', this.handleInputDebounced.bind(this, newNode, index));
  }

  handleInput(node, index) {

    this.replaceInputTemplate(node, index);
    this.sendToContact()

  }

  replaceInputTemplate(node, index) {

    this.contentTemplate.querySelectorAll(`#input_${index}`).forEach((input) => {
      input.textContent = node.textContent;
    });

    const currentElement = document.activeElement;

    if (!this.isElementInNodeList(currentElement, this.pages.querySelectorAll('span[id^="input_"]'))) {

      this.rebuild(this.showHeaderValue);
    }
    this.pages.querySelectorAll('span[id^="input_"]').forEach((span, idx) => {
      span.addEventListener('blur', this.handleInputDebounced.bind(this, span, idx));
    });
  }

  rebuild(showHeader = false) {
    this.contentTemplate.classList.remove('hidden');
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

    this.contentTemplate.classList.add('hidden');
    const pagesHTML = pagesContent.map((page) => page.map((node) => node.outerHTML).join(''));
    const pagesDiv = this.pagesTarget;
    pagesDiv.innerHTML = '';

    for (let i = 0; i < pagesHTML.length; i++) {
      const page = `<div class="bg-white my-8 mx-16 drop-shadow-lg overflow-hidden print:overflow-visible print:break-inside-avoid w-[655px] h-[840px] print:w-[980px] print:h-[1400px] print:drop-shadow-none">
                <div class="overflow-visible print:w-[980px]  my-8 mx-16 h-full print:font-sans print:my-0 print:mx-0 print:py-0 print:overflow-visible print:drop-shadow-none print:leading-[10]">
                    ${pagesHTML[i]}
                </div>
            </div>`;
      pagesDiv.insertAdjacentHTML('beforeend', page);
    }


  }

  async sendToContact() {
    if (this.isSending) {
      return;
    }

    if (document.getElementById('save_on_contact').checked) {
      this.isSending = true; // Set the flag to true

      try {
        const content = this.content.innerHTML;
        const contract_template_id = this.contentTemplate.dataset.contractTemplateId;

        post(this.contactUrlValue, {
          responseType: 'json',
          body: JSON.stringify({
            content: content,
            contact_id: this.contactIdValue,
            contract_template_id: contract_template_id
          })
        });

      } finally {
        this.isSending = false;
      }
    }
  }


}