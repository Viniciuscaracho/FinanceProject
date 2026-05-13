import React, { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import { T, DISPLAY } from '@/lib/tokens'

/* ─── Tokens (inline — imune a dark mode) ───────── */
/* ─── Context ────────────────────────────────────── */
const ModalContext = React.createContext(null)

export const useModal = () => {
  const ctx = React.useContext(ModalContext)
  if (!ctx) throw new Error('useModal deve ser usado dentro de ModalProvider')
  return ctx
}

export const ModalProvider = ({ children }) => {
  const [stack, setStack] = React.useState([])

  const openModal  = useCallback((modal) => setStack(prev => [...prev, { ...modal, id: Date.now() + Math.random() }]), [])
  const closeModal = useCallback((id)    => setStack(prev => prev.filter(m => m.id !== id)), [])
  const closeAll   = useCallback(()      => setStack([]), [])

  return (
    <ModalContext.Provider value={{ openModal, closeModal, closeAll }}>
      {children}
      {stack.map(modal => (
        <EnhancedModal key={modal.id} {...modal} onClose={() => closeModal(modal.id)} isOpen />
      ))}
    </ModalContext.Provider>
  )
}

/* ─── Tamanhos ───────────────────────────────────── */
const SIZES = {
  xs:   280, sm:   384, md:   448,
  lg:   512, xl:   576, '2xl': 672,
  '3xl': 768, '4xl': 896, '5xl': 1024,
  full: '100%',
}

/* ─── Tipos ──────────────────────────────────────── */
const TYPE_META = {
  default: { icon: null,            accent: T.brand,   headerBg: T.white  },
  success: { icon: CheckCircle,     accent: '#16a34a', headerBg: '#f0fdf4' },
  warning: { icon: AlertTriangle,   accent: '#d97706', headerBg: '#fffbeb' },
  error:   { icon: AlertCircle,     accent: '#dc2626', headerBg: '#fef2f2' },
  info:    { icon: Info,            accent: T.brand,   headerBg: '#eff6ff' },
}

/* ─── Animações ──────────────────────────────────── */
const ANIMATIONS = {
  fadeIn:         { from: 'opacity:0;transform:none',         to: '' },
  slideIn:        { keyframes: 'orbi-slide-up' },
  zoomIn:         { keyframes: 'orbi-zoom-in' },
  slideInFromTop: { keyframes: 'orbi-slide-down' },
}

const KEYFRAMES = `
@keyframes orbi-slide-up   { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
@keyframes orbi-zoom-in    { from { opacity:0; transform:scale(0.95) }      to { opacity:1; transform:scale(1) } }
@keyframes orbi-slide-down { from { opacity:0; transform:translateY(-16px)} to { opacity:1; transform:translateY(0) } }
`

/* ─── EnhancedModal ──────────────────────────────── */
const EnhancedModal = ({
  isOpen = false,
  onClose,
  title,
  children,
  size = 'md',
  type = 'default',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  animation = 'slideIn',
  className,
  ...props
}) => {
  const overlayRef = useRef(null)
  const dialogRef  = useRef(null)
  const prevFocus  = useRef(null)
  const meta = TYPE_META[type] ?? TYPE_META.default
  const Icon = meta.icon

  useEffect(() => {
    if (!isOpen) return
    prevFocus.current = document.activeElement
    dialogRef.current?.focus()
    document.body.style.overflow = 'hidden'

    if (!closeOnEscape) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, closeOnEscape, onClose])

  useEffect(() => {
    if (isOpen) return
    document.body.style.overflow = ''
    prevFocus.current?.focus()
  }, [isOpen])

  if (!isOpen) return null

  const maxW = typeof SIZES[size] === 'number' ? `${SIZES[size]}px` : SIZES[size]
  const anim = ANIMATIONS[animation] ?? ANIMATIONS.slideIn

  const dialogStyle = {
    position: 'relative',
    width: '100%',
    maxWidth: maxW,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    background: T.white,
    border: `1px solid ${T.border}`,
    borderRadius: 12,
    boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
    outline: 'none',
    animation: anim.keyframes ? `${anim.keyframes} 240ms cubic-bezier(0.16,1,0.3,1) both` : undefined,
    ...DISPLAY,
  }

  return createPortal(
    <>
      <style>{KEYFRAMES}</style>
      <div
        ref={overlayRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'orbi-modal-title' : undefined}
        onClick={closeOnOverlayClick ? (e) => { if (e.target === overlayRef.current) onClose() } : undefined}
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <div ref={dialogRef} tabIndex={-1} style={dialogStyle} {...props}>

          {/* Header */}
          {(title || showCloseButton) && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 22px 16px',
              borderBottom: `1px solid ${T.border}`,
              background: meta.headerBg,
              borderRadius: '12px 12px 0 0',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {Icon && <Icon size={18} style={{ color: meta.accent, flexShrink: 0 }} />}
                {title && (
                  <h2 id="orbi-modal-title" style={{
                    fontSize: 15, fontWeight: 700, color: T.text,
                    margin: 0, letterSpacing: '-0.01em',
                  }}>
                    {title}
                  </h2>
                )}
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  aria-label="Fechar"
                  style={{
                    padding: 6, border: 'none', borderRadius: 6, cursor: 'pointer',
                    background: 'transparent', color: T.muted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '22px 22px' }}>
            {children}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

/* ─── ModalHeader / Body / Footer ───────────────── */
export const ModalHeader = ({ children, style, ...props }) => (
  <div style={{ marginBottom: 16, ...style }} {...props}>{children}</div>
)

export const ModalBody = ({ children, style, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, ...style }} {...props}>{children}</div>
)

export const ModalFooter = ({ children, style, ...props }) => (
  <div style={{
    display: 'flex', flexDirection: 'row', justifyContent: 'flex-end',
    gap: 8, paddingTop: 18, borderTop: `1px solid ${T.border}`,
    flexWrap: 'wrap',
    ...style,
  }} {...props}>
    {children}
  </div>
)

/* ─── useModalState ──────────────────────────────── */
export const useModalState = (initial = false) => {
  const [isOpen, setIsOpen] = React.useState(initial)
  const open   = useCallback(() => setIsOpen(true), [])
  const close  = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen(v => !v), [])
  return { isOpen, open, close, toggle }
}

/* ─── ConfirmModal ───────────────────────────────── */
export const ConfirmModal = ({
  isOpen, onClose, onConfirm,
  title = 'Confirmar ação',
  message,
  confirmText = 'Confirmar',
  cancelText  = 'Cancelar',
  type = 'warning',
  loading = false,
  ...props
}) => {
  const meta = TYPE_META[type] ?? TYPE_META.warning

  return (
    <EnhancedModal isOpen={isOpen} onClose={onClose} title={title} type={type} size="sm" {...props}>
      <ModalBody>
        <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.65, margin: 0 }}>{message}</p>
      </ModalBody>
      <ModalFooter>
        <button
          onClick={onClose}
          disabled={loading}
          style={{
            padding: '9px 18px', border: `1px solid ${T.border}`, borderRadius: 8,
            background: T.white, color: T.text, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', ...DISPLAY,
          }}
        >
          {cancelText}
        </button>
        <button
          onClick={() => { onConfirm(); onClose() }}
          disabled={loading}
          style={{
            padding: '9px 18px', border: 'none', borderRadius: 8,
            background: meta.accent, color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            ...DISPLAY,
          }}
        >
          {confirmText}
        </button>
      </ModalFooter>
    </EnhancedModal>
  )
}

export default EnhancedModal
