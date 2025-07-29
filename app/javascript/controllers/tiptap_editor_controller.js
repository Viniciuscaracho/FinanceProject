import {Controller} from "@hotwired/stimulus";
import {Editor} from '@tiptap/core'
import TextAlign from '@tiptap/extension-text-align'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Strike from '@tiptap/extension-strike'
import Underline from '@tiptap/extension-underline'
import HardBreak from '@tiptap/extension-hard-break'
import Document from '@tiptap/extension-document'
import Heading from '@tiptap/extension-heading'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import History from '@tiptap/extension-history'
import Tribute from "tributejs";
import {debounce} from "lodash";
import Input from '../tiptap/input'


export default class extends Controller {
  static values = {
    content: String,
    suggestions: Array,
    placeholder: String
  }

  static targets = [
    'button',
    'redoButton',
    'undoButton',
  ]

  connect() {

    this.editor = new Editor({
      element: document.getElementById("editor"),
      extensions: [
        Input.configure(
          {
            HTMLAttributes: {
              class: 'px-1 w-32 flex h-4 inline-flex rounded-md empty:bg-gray-100 mx-1 empty:placeholder-opacity-100 disabled:cursor-not-allowed placeholder:text-sm disabled:placeholder-opacity-100 empty:ring-1 ring-gray-300',
              placeholder: this.placeholderValue,
              disabled: true,
              id: 'input',
            }
          }
        ),
        Document,
        Paragraph.configure({
            HTMLAttributes: {
              class: 'min-h-[1rem] text-xs print:text-[1.35rem] print:min-h-[1.9rem] print:font-sans leading-4 print:leading-7',
            },
          }
        ),
        Text,
        Heading.configure({
            HTMLAttributes: {
              class: 'min-h-[1rem] print:leading-7 print:min-h-[2rem] print:font-sans',
            },
          }
        ),
        Bold,
        Italic,
        Strike,
        Underline,
        History.configure({
          limit: 100,
          newGroupDelay: 200,
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph', 'input'],
        }),
        HardBreak.extend({
          addKeyboardShortcuts() {
            return {
              Enter: () => {
                if (this.editor.isActive('hardBreak')) {
                  return this.editor.commands.insertContent('<p></p>');
                }
                return false
              },
            };
          },
        }),
      ],
      editorProps: {
        attributes: {
          class: 'bg-white border border-gray-300 rounded-b-md focus:outline-none h-96 overflow-auto py-3 px-16'
        },
      },
      onUpdate: debounce(({editor}) => {
        this.onUpdate(editor)
      }, 200),

      content: this.contentValue,
      onCreate: ({editor}) => {
        this.onCreate(editor)

      },
      onSelectionUpdate: debounce(() => {
        this.activateButtons()
      }, 150),
    })

    this.initializeTribute()
    this.activateButtons()
  }


  disconnect() {
    this.editor.destroy()
  }

  onCreate(editor) {

    document.querySelector("#content").innerHTML = editor.getHTML();
    const showHeader = document.querySelector('#show_header');
    let header = document.querySelector('#header_document');
    let content = document.querySelector("#content")
    content.insertBefore(header, content.firstChild);


    showHeader.addEventListener('change', (event) => {

      let editorHTML = this.editor.getHTML();

      let header = document.querySelector('#header_document');
      let content = document.querySelector("#content")
      content.innerHTML = editorHTML;

      content.insertBefore(header, content.firstChild);

      const contentField = document.querySelector('#document_content');
      contentField.value = editorHTML;

      const showHeader = document.querySelector('#show_header');
      this.rebuild(showHeader.checked)
    })

    this.rebuild(showHeader.checked)

  }

  onUpdate() {
    let editorHTML = this.editor.getHTML();

    let header = document.querySelector('#header_document');
    let content = document.querySelector("#content")
    content.innerHTML = editorHTML;

    content.insertBefore(header, content.firstChild);

    const contentField = document.querySelector('#document_content');
    contentField.value = editorHTML;

    const showHeader = document.querySelector('#show_header');
    this.rebuild(showHeader.checked)

    document.dispatchEvent(new Event('editor-change'))
  }

  rebuild(showHeader = false) {
    const div = document.querySelector('#content');
    const header = document.querySelector('#header_document');
    const heightMAX = 750;
    let nodes = Array.from(div.childNodes);
    let pagesContent = [];
    let pages;
    let sumNodesHeight = nodes.reduce((sum, node) => sum + Math.ceil(parseFloat(node.getBoundingClientRect().height)), 0);

    if (showHeader) {
      nodes.shift();
      header.classList.remove('hidden');
      pages = Math.ceil((sumNodesHeight + header.getBoundingClientRect().height) / heightMAX);
      nodes.unshift(header);
    } else {
      header.classList.add('hidden');
      pages = Math.ceil(sumNodesHeight / heightMAX);
    }

    if (div.childNodes.length <= 1) return;

    for (let i = 0; i < pages; i++) {
      let page = [];
      let height = 0;

      while (height < heightMAX && nodes.length > 0) {
        let node = nodes.shift();
        let nodeHeight = Math.ceil(parseFloat(node.getBoundingClientRect().height));

        if (height + nodeHeight > heightMAX) {
          if (node.nodeType === 1) {
            nodes.unshift(node);
            break;
          }

          let overflowContent = document.createElement('div');
          overflowContent.appendChild(node.cloneNode(true));
          let remainingHeight = heightMAX - height;

          while (nodes.length > 0 && remainingHeight > 0) {
            let childNode = nodes.shift();
            let childNodeHeight = Math.ceil(parseFloat(childNode.getBoundingClientRect().height));

            if (childNodeHeight <= remainingHeight) {
              overflowContent.appendChild(childNode.cloneNode(true));
              remainingHeight -= childNodeHeight;
            } else {
              nodes.unshift(childNode);
              break;
            }
          }

          page.push(overflowContent);
          height += heightMAX;
        } else {
          page.push(node);
          height += nodeHeight;
        }
      }
      pagesContent.push(page);
    }

    let pagesHTML = pagesContent.map((page, index) => {
      let pageHTML = page.map((node) => {
        return node.outerHTML || node.textContent;
      });
      return `<div class="print:break-inside-avoid" id="page-${index}"><div id="content">${pageHTML.join('')}</div></div>`;
    });

    let pagesDiv = document.getElementById('pages');
    pagesDiv.innerHTML = '';

    for (let i = 0; i < pagesHTML.length; i++) {
      let page = `<div class="bg-white drop-shadow-lg my-8 mx-16 overflow-hidden" style="width: 655px; height: 840px;" data-zoom-target="div">
                    <div class="my-8 mx-16 overflow-hidden" > 
                        ${pagesHTML[i]}
                    </div>
                </div>`;

      let element = document.createElement('div');
      element.innerHTML = page;
      pagesDiv.appendChild(element);
    }
  }


  align_button(event) {
    let alignment = event.target.dataset.alignment

    if (this.editor.isActive({textAlign: alignment})) {
      this.editor.chain().focus().unsetTextAlign().run()
    } else {
      this.editor.chain().focus().setTextAlign(alignment).run()
    }

    this.activateButtons()
  }

  toggle_button(event) {
    let mark = event.target.dataset.mark
    let _function = `toggle${mark}`

    this.editor.chain().focus()[_function]().run();
    this.activateButtons()
  }

  toggle_heading(event) {
    let level = event.target.dataset.level

    this.editor.chain().focus().toggleHeading({level: parseInt(level)}).run();
    this.activateButtons()
  }


  initializeTribute() {
    let editor = document.getElementsByClassName("ProseMirror")

    this.tribute = new Tribute({
      allowSpaces: true, lookup: "name",
      values: this.suggestionsValue,
      trigger: "@",
      selectTemplate: function (item) {
        return `[${item.original.name}]`;
      },
      noMatchTemplate: function () {
        return null;
      },
    })

    this.tribute.attach(editor)
  }

  redo() {
    this.editor.chain().focus().redo().run()
    this.activateButtons()
  }

  undo() {
    this.editor.chain().focus().undo().run()
    this.activateButtons()
  }

  insertInput() {

    //     insert input tag, with tag div wrapper

    this.editor.chain().focus().insertContent({
      type: 'input',
      attrs: {
        placeholder: this.placeholderValue,
        disabled: true,
        id: 'input',
      }
    }).run()
  }

  activateButtons() {

    this.buttonTargets.forEach((button) => {

      this.redoButtonTarget.disabled = !this.editor.can().redo()
      this.undoButtonTarget.disabled = !this.editor.can().undo()

      if (button.dataset.type === 'heading') {

        if (this.editor.isActive("heading", {level: parseInt(button.dataset.level)})) {
          button.classList.add('bg-gray-200')
          return
        }

        button.classList.remove('bg-gray-200')
        return

      }

      if (button.dataset.type === 'textAlign') {

        if (this.editor.isActive({textAlign: button.dataset.alignment})) {
          button.classList.add('bg-gray-200')
          return
        }

        button.classList.remove('bg-gray-200')
        return

      }

      if (this.editor.isActive(button.dataset.type)) {

        button.classList.add('bg-gray-200')
        return
      }

      button.classList.remove('bg-gray-200')

    })

  }

}