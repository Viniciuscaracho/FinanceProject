import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import {
  Undo2, Redo2,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Type as TypeIcon, Variable,
  List, ListOrdered, ListChecks,
  Quote, Code, Code2, Minus,
  Link2, Link2Off,
  Highlighter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const TEXT_COLORS = [
  { color: null,      label: 'Padrão' },
  { color: '#000000', label: 'Preto' },
  { color: '#374151', label: 'Cinza' },
  { color: '#EF4444', label: 'Vermelho' },
  { color: '#F97316', label: 'Laranja' },
  { color: '#EAB308', label: 'Amarelo' },
  { color: '#22C55E', label: 'Verde' },
  { color: '#3B82F6', label: 'Azul' },
  { color: '#8B5CF6', label: 'Roxo' },
  { color: '#EC4899', label: 'Rosa' },
]

const HIGHLIGHT_COLORS = [
  { color: null,      label: 'Remover' },
  { color: '#FEF08A', label: 'Amarelo' },
  { color: '#BBF7D0', label: 'Verde' },
  { color: '#BFDBFE', label: 'Azul' },
  { color: '#FBCFE8', label: 'Rosa' },
  { color: '#FED7AA', label: 'Laranja' },
  { color: '#E5E7EB', label: 'Cinza' },
]

const BLOCK_TYPES = [
  { label: 'Parágrafo',  action: (e) => e.chain().focus().setParagraph().run() },
  { label: 'Título 1',   action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { label: 'Título 2',   action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { label: 'Título 3',   action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { label: 'Título 4',   action: (e) => e.chain().focus().toggleHeading({ level: 4 }).run() },
]

const BLOCK_LABEL_MAP = [
  { check: (e) => e.isActive('heading', { level: 1 }), label: 'Título 1' },
  { check: (e) => e.isActive('heading', { level: 2 }), label: 'Título 2' },
  { check: (e) => e.isActive('heading', { level: 3 }), label: 'Título 3' },
  { check: (e) => e.isActive('heading', { level: 4 }), label: 'Título 4' },
]

function getActiveBlockLabel(editor) {
  for (const { check, label } of BLOCK_LABEL_MAP) {
    if (check(editor)) return label
  }
  return 'Parágrafo'
}

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
        heading: { levels: [1, 2, 3, 4] },
        link: {
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-blue-600 underline cursor-pointer',
            rel: 'noopener noreferrer',
            target: '_blank',
          },
        },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Color,
      TextStyle,
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4 editor-content',
      },
    },
  })

  if (editorRef) {
    editorRef.current = editor
  }

  if (!editor) return null

  const Btn = ({ onClick, isActive, disabled, children, tooltip }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn('h-7 w-7 p-0 rounded-sm', isActive && 'bg-gray-200 dark:bg-gray-700')}
      title={tooltip}
    >
      {children}
    </Button>
  )

  const Sep = () => (
    <span className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5 self-center flex-shrink-0" />
  )

  const handleLink = () => {
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run()
      return
    }
    const url = window.prompt('URL do link:')
    if (!url) return
    editor.chain().focus().setLink({ href: url }).run()
  }

  const activeTextColor = editor.getAttributes('textStyle').color ?? null
  const activeHighlight = editor.getAttributes('highlight').color ?? null

  return (
    <div className={cn('border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 flex flex-col', className)}>
      {/* ── Toolbar ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 rounded-t-lg flex items-center gap-0.5 p-1.5 flex-wrap">

        {/* Undo / Redo */}
        <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} tooltip="Desfazer">
          <Undo2 className="h-3.5 w-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} tooltip="Refazer">
          <Redo2 className="h-3.5 w-3.5" />
        </Btn>

        <Sep />

        {/* Block type */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2 rounded-sm text-xs min-w-[80px] justify-between gap-1">
              <TypeIcon className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{getActiveBlockLabel(editor)}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {BLOCK_TYPES.map(({ label, action }) => (
              <DropdownMenuItem key={label} onClick={() => action(editor)}>
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Sep />

        {/* Text formatting */}
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} tooltip="Negrito (Ctrl+B)">
          <Bold className="h-3.5 w-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} tooltip="Itálico (Ctrl+I)">
          <Italic className="h-3.5 w-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} tooltip="Sublinhado (Ctrl+U)">
          <UnderlineIcon className="h-3.5 w-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} tooltip="Riscado">
          <Strikethrough className="h-3.5 w-3.5" />
        </Btn>

        <Sep />

        {/* Alignment */}
        <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} tooltip="Alinhar esquerda">
          <AlignLeft className="h-3.5 w-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} tooltip="Centralizar">
          <AlignCenter className="h-3.5 w-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} tooltip="Alinhar direita">
          <AlignRight className="h-3.5 w-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} tooltip="Justificar">
          <AlignJustify className="h-3.5 w-3.5" />
        </Btn>

        <Sep />

        {/* Lists */}
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} tooltip="Lista com marcadores">
          <List className="h-3.5 w-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} tooltip="Lista numerada">
          <ListOrdered className="h-3.5 w-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} tooltip="Lista de tarefas">
          <ListChecks className="h-3.5 w-3.5" />
        </Btn>

        <Sep />

        {/* Blocks */}
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} tooltip="Citação">
          <Quote className="h-3.5 w-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} tooltip="Código inline">
          <Code className="h-3.5 w-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} tooltip="Bloco de código">
          <Code2 className="h-3.5 w-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} tooltip="Divisor horizontal">
          <Minus className="h-3.5 w-3.5" />
        </Btn>

        <Sep />

        {/* Link */}
        <Btn onClick={handleLink} isActive={editor.isActive('link')} tooltip={editor.isActive('link') ? 'Remover link' : 'Inserir link'}>
          {editor.isActive('link') ? <Link2Off className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
        </Btn>

        <Sep />

        {/* Text color */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-sm flex flex-col items-center justify-center gap-0" title="Cor do texto">
              <span className="text-[11px] font-bold leading-none" style={{ color: activeTextColor ?? 'currentColor' }}>A</span>
              <span className="w-4 h-0.5 rounded-full" style={{ background: activeTextColor ?? '#000' }} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="p-2">
            <p className="text-xs text-gray-500 mb-2 px-1">Cor do texto</p>
            <div className="grid grid-cols-5 gap-1">
              {TEXT_COLORS.map(({ color, label }) => (
                <button
                  key={label}
                  title={label}
                  onClick={() => color ? editor.chain().focus().setColor(color).run() : editor.chain().focus().unsetColor().run()}
                  className={cn(
                    'h-6 w-6 rounded border border-gray-200 flex items-center justify-center hover:scale-110 transition-transform',
                    !color && 'text-xs font-bold text-gray-500'
                  )}
                  style={{ background: color ?? '#fff' }}
                >
                  {!color && '—'}
                </button>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Highlight color */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-sm" title="Realçar texto">
              <Highlighter className="h-3.5 w-3.5" style={{ color: activeHighlight ? '#374151' : undefined }} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="p-2">
            <p className="text-xs text-gray-500 mb-2 px-1">Realce</p>
            <div className="grid grid-cols-4 gap-1">
              {HIGHLIGHT_COLORS.map(({ color, label }) => (
                <button
                  key={label}
                  title={label}
                  onClick={() => color ? editor.chain().focus().setHighlight({ color }).run() : editor.chain().focus().unsetHighlight().run()}
                  className={cn(
                    'h-6 w-6 rounded border border-gray-200 flex items-center justify-center hover:scale-110 transition-transform',
                    !color && 'text-xs font-bold text-gray-500'
                  )}
                  style={{ background: color ?? '#fff' }}
                >
                  {!color && '✕'}
                </button>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Variable (opcional) */}
        {onVariableInsert && (
          <>
            <Sep />
            <Btn onClick={onVariableInsert} tooltip="Inserir variável">
              <Variable className="h-3.5 w-3.5" />
            </Btn>
          </>
        )}
      </div>

      {/* ── Editor content ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <EditorContent editor={editor} className="h-full focus:outline-none" />
      </div>

      {/* ── Editor list & block styles ── */}
      <style>{`
        .editor-content ul:not([data-type="taskList"]) {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin: 0.5rem 0 !important;
        }
        .editor-content ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin: 0.5rem 0 !important;
        }
        .editor-content ul:not([data-type="taskList"]) > li,
        .editor-content ol > li {
          display: list-item !important;
          padding-left: 0.25rem;
        }
        .editor-content ul:not([data-type="taskList"]) > li > p,
        .editor-content ol > li > p {
          margin: 0;
        }
        .editor-content blockquote {
          border-left: 3px solid #d1d5db;
          padding-left: 1rem;
          margin-left: 0;
          color: #6b7280;
          font-style: italic;
        }
        .editor-content code:not(pre code) {
          background: #f3f4f6;
          border-radius: 3px;
          padding: 0.1em 0.35em;
          font-size: 0.875em;
          font-family: monospace;
          color: #e11d48;
        }
        .editor-content pre {
          background: #1e293b;
          color: #e2e8f0;
          border-radius: 6px;
          padding: 1rem;
          overflow-x: auto;
          font-family: monospace;
          font-size: 0.875em;
          margin: 0.75rem 0;
        }
        .editor-content pre code { background: none; color: inherit; padding: 0; font-size: inherit; }
        .editor-content hr { border: none; border-top: 2px solid #e5e7eb; margin: 1rem 0; }
        .editor-content a { color: #3b82f6; text-decoration: underline; cursor: pointer; }
      `}</style>
      <style>{`
        .editor-content ul[data-type="taskList"] {
          list-style: none !important;
          padding-left: 0 !important;
          margin-left: 0 !important;
        }
        .editor-content ul[data-type="taskList"] > li {
          display: flex !important;
          align-items: flex-start;
          gap: 0.5rem;
          padding-left: 0 !important;
          margin-left: 0 !important;
        }
        .editor-content ul[data-type="taskList"] > li::before,
        .editor-content ul[data-type="taskList"] > li::marker {
          display: none !important;
          content: none !important;
        }
        .editor-content ul[data-type="taskList"] > li > label {
          display: flex;
          align-items: center;
          margin-top: 3px;
          flex-shrink: 0;
          cursor: pointer;
        }
        .editor-content ul[data-type="taskList"] > li > label input[type="checkbox"] {
          width: 15px;
          height: 15px;
          accent-color: #4C60AA;
          cursor: pointer;
          flex-shrink: 0;
        }
        .editor-content ul[data-type="taskList"] > li > label span { display: none; }
        .editor-content ul[data-type="taskList"] > li > div {
          flex: 1;
          min-width: 0;
        }
        .editor-content ul[data-type="taskList"] > li[data-checked="true"] > div p {
          text-decoration: line-through;
          opacity: 0.5;
        }
      `}</style>
    </div>
  )
}
