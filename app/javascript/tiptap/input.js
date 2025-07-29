import {mergeAttributes, Node} from '@tiptap/core'

export default Node.create({
    name: 'input',
    content: 'inline*',
    group: 'inline',
    inline: true,
    parseHTML() {
        return [
            {
                tag: 'input',
            },
        ]
    },
    renderHTML({HTMLAttributes}) {
        return [ 'input', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
    },
    addKeyboardShortcuts() {
        return {
            // insert input on (ctrl or command) + i
            'Mod-m': () => this.editor.commands.insertContent('<input />'),
        }
    },

})