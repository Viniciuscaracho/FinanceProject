import {Controller} from "@hotwired/stimulus"
import {Draggable} from '@shopify/draggable';

export default class extends Controller {
  static targets = ['draggable', 'droppable']

  connect() {
    this.draggable = new Draggable(this.draggableTarget, {
      draggable: '.draggable-source',
      classes: {
        'mirror': ['w-fit', 'shadow-lg'],
      },
    });
  }
}
