import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import {
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Type as TypeIcon,
  Variable
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function DocumentEditor({ 
  content = '', 
  onChange,
  onVariableInsert,
  className,
  placeholder = 'Digite o conteúdo do documento...',
  editorRef
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5],
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Color,
      TextStyle,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4 editor-content',
      },
    },
  })

  // Expor editor via ref se fornecido
  if (editorRef) {
    editorRef.current = editor
  }

  if (!editor) {
    return null
  }

  const ToolbarButton = ({ onClick, isActive, disabled, children, tooltip }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-7 w-7 p-0 rounded-sm",
        isActive && "bg-gray-200"
      )}
      title={tooltip}
    >
      {children}
    </Button>
  )

  return (
    <div className={cn("border border-gray-300 rounded-lg bg-white flex flex-col h-full", className)}>
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-300 rounded-t-lg flex items-center gap-1 p-1.5 flex-wrap">
        {/* Undo/Redo */}
        <div className="flex items-center border-r pr-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            tooltip="Desfazer"
          >
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            tooltip="Refazer"
          >
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Alignment */}
        <div className="flex items-center border-r pr-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            tooltip="Alinhar à esquerda"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            tooltip="Centralizar"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            tooltip="Alinhar à direita"
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            isActive={editor.isActive({ textAlign: 'justify' })}
            tooltip="Justificar"
          >
            <AlignJustify className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Formatting */}
        <div className="flex items-center border-r pr-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            tooltip="Negrito"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            tooltip="Itálico"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            tooltip="Sublinhado"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            tooltip="Riscado"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Heading */}
        <div className="flex items-center border-r pr-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 rounded-sm"
              >
                <TypeIcon className="h-4 w-4 mr-1" />
                <span className="text-xs">Título</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              >
                <h1 className="text-2xl">Título 1</h1>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              >
                <h2 className="text-xl">Título 2</h2>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              >
                <h3 className="text-lg">Título 3</h3>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().setParagraph().run()}
              >
                Parágrafo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Variable Button */}
        {onVariableInsert && (
          <div className="flex items-center">
            <ToolbarButton
              onClick={onVariableInsert}
              tooltip="Inserir variável"
            >
              <Variable className="h-4 w-4" />
            </ToolbarButton>
          </div>
        )}
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto bg-white border-t border-gray-300 min-h-0">
        <EditorContent editor={editor} className="h-full p-4 focus:outline-none min-h-[400px]" />
      </div>
    </div>
  )
}

