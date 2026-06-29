import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Camera, Copy, Check, ExternalLink, Loader2, Eye, EyeOff,
  MapPin, Phone, X, Instagram, Globe, Share2, BarChart2,
  ImageIcon, User, ChevronRight, Save, Sparkles, ArrowUpRight, Move, Code,
} from 'lucide-react'
import { apiService } from '../lib/api'
import { toast } from 'sonner'
import { T, DISPLAY } from '@/lib/tokens'
import { useIsMobile } from '@/hooks/use-mobile'
import { profileSlug } from '@/lib/seoSlugs'

const BASE_URL = import.meta.env.VITE_PUBLIC_URL || window.location.origin

/* ─── Especialidades por categoria ───────────── */
const SPECIALTY_BY_CATEGORY = {
  'Nutricionista':    ['Emagrecimento','Esportiva','Saúde feminina','Gestação','Infantil','Online','Vegetariana/Vegana','Diabetes','Hipertensão','Oncológica','Renal','Idosos'],
  'Fisioterapeuta':   ['Ortopédica','Neurológica','Respiratória','Pediátrica','Esportiva','Uroginecológica','RPG','Pilates','Online','Domiciliar','Gerontológica','Reumatológica'],
  'Psicólogo':        ['TCC','Psicanálise','Infantil','Adolescente','Ansiedade','Depressão','Relacionamentos','Online','EMDR','Gestalt','Luto','Avaliação psicológica'],
  'Personal Trainer': ['Musculação','Funcional','Emagrecimento','Hipertrofia','Idosos','Online','Corrida','HIIT','Feminino','Esportivo','Pós-cirúrgico','CrossFit'],
  'Médico':           ['Clínica geral','Cardiologia','Endocrinologia','Dermatologia','Ginecologia','Neurologia','Pediatria','Psiquiatria','Online','Ortopedia','Urologia','Infectologia'],
  'Dentista':         ['Ortodontia','Implantodontia','Estética dental','Endodontia','Periodontia','Odontopediatria','Clareamento','Cirurgia','Bruxismo','Urgência','Online','Prótese'],
  'Fonoaudiólogo':    ['Infantil','Adulto','Voz','Deglutição','Linguagem','Audição','Online','Neurológico'],
  'Terapeuta':        ['Reiki','Acupuntura','Massoterapia','Thetahealing','Constelação familiar','Florais','Cristaloterapia','Online'],
  'Coach':            ['Life coaching','Executivo','Carreira','Financeiro','Relacionamentos','Emagrecimento','Liderança','Online'],
}
const GENERIC_SPECIALTIES = ['Presencial','Online','Infantil','Adulto','Idosos','Esportivo','Atendimento domiciliar','Preventivo']
const getSpecialties = (cat) => SPECIALTY_BY_CATEGORY[cat] || GENERIC_SPECIALTIES

const CHECKS = (acct, co, form) => [
  { key: 'visible',     label: 'Visível na vitrine',   done: !!acct?.directory_visible },
  { key: 'logo',        label: 'Foto de perfil',       done: !!co?.logo_url },
  { key: 'cover',       label: 'Foto de capa',         done: !!co?.cover_url },
  { key: 'category',    label: 'Categoria',            done: !!(form?.profession_category) },
  { key: 'description', label: 'Descrição pública',    done: !!(form?.directory_description) },
  { key: 'specialties', label: 'Especialidades',       done: !!(form?.specialties?.length) },
  { key: 'instagram',        label: 'Instagram',            done: !!(form?.instagram_url) },
  { key: 'registration',     label: 'Registro profissional', done: !!(form?.professional_registration) },
  { key: 'phone',       label: 'Telefone',             done: !!(form?.phone_number) },
  { key: 'city',        label: 'Cidade / bairro',      done: !!(form?.address_city) },
]

/* ─── Primitivos — mesma linguagem do Dashboard ─ */
function Panel({ children, style, id }) {
  return (
    <div id={id} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, ...style }}>
      {children}
    </div>
  )
}

// Mesma tipografia do Dashboard (ALL-CAPS, muted, 11px)
function SectionHeader({ label, icon: Icon, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px 12px' }}>
      {Icon && <Icon size={12} style={{ color: T.muted, flexShrink: 0 }} />}
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted, margin: 0, flex: 1 }}>
        {label}
      </p>
      {right}
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: T.border, margin: '0 20px' }} />
}

/* ─── CopyField ──────────────────────────────── */
function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <p style={{ fontSize: 11, fontWeight: 600, color: T.muted, margin: 0 }}>{label}</p>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{
          flex: 1, fontSize: 12, color: T.muted, background: T.bg,
          border: `1px solid ${T.border}`, borderRadius: 8,
          padding: '7px 11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontFamily: 'monospace',
        }}>{value}</div>
        <button onClick={copy} style={{
          display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
          fontSize: 12, fontWeight: 600,
          color: copied ? T.green : T.brand,
          background: copied ? T.green + '12' : T.chip,
          border: `1px solid ${copied ? T.green + '35' : 'transparent'}`,
          borderRadius: 7, padding: '7px 12px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
        }}>
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
    </div>
  )
}

/* ─── RepositionModal — estilo WhatsApp ─────── */
function RepositionModal({ url, shape, initialPosition, onConfirm, onClose }) {
  const [pos, setPos] = useState({ ...initialPosition })
  const imgRef    = useRef()
  const dragging  = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })

  const isCircle = shape === 'circle'
  const frameW   = isCircle ? 260 : 560
  const frameH   = isCircle ? 260 : 210

  const moveDelta = useCallback((dx, dy) => {
    const img = imgRef.current
    if (!img || !img.naturalWidth) return
    const nw = img.naturalWidth, nh = img.naturalHeight
    const scale  = Math.max(frameW / nw, frameH / nh)
    const extraX = nw * scale - frameW
    const extraY = nh * scale - frameH
    setPos(p => ({
      x: Math.max(0, Math.min(100, p.x + (extraX > 1 ? (-dx / extraX) * 100 : 0))),
      y: Math.max(0, Math.min(100, p.y + (extraY > 1 ? (-dy / extraY) * 100 : 0))),
    }))
  }, [frameW, frameH])

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return
      moveDelta(e.clientX - lastMouse.current.x, e.clientY - lastMouse.current.y)
      lastMouse.current = { x: e.clientX, y: e.clientY }
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',  onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [moveDelta])

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'linear-gradient(145deg, #0d1424 0%, #080b12 55%, #0a0d14 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30,
        ...DISPLAY,
      }}
    >
      {/* título */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#e8edf5', fontSize: 16, fontWeight: 700, margin: '0 0 5px', letterSpacing: '-0.02em' }}>
          {isCircle ? 'Foto de perfil' : 'Foto de capa'}
        </p>
        <p style={{ color: 'rgba(160,180,220,0.6)', fontSize: 12, margin: 0 }}>
          Arraste para enquadrar como preferir
        </p>
      </div>

      {/* crop frame — box-shadow cria a máscara escura fora do frame */}
      <div
        onMouseDown={e => { dragging.current = true; lastMouse.current = { x: e.clientX, y: e.clientY } }}
        onTouchStart={e => { dragging.current = true; const t = e.touches[0]; lastMouse.current = { x: t.clientX, y: t.clientY } }}
        onTouchMove={e => { e.preventDefault(); const t = e.touches[0]; moveDelta(t.clientX - lastMouse.current.x, t.clientY - lastMouse.current.y); lastMouse.current = { x: t.clientX, y: t.clientY } }}
        onTouchEnd={() => { dragging.current = false }}
        style={{
          width: frameW, height: frameH,
          borderRadius: isCircle ? '50%' : 12,
          overflow: 'hidden',
          cursor: 'move',
          position: 'relative',
          flexShrink: 0,
          outline: '2px solid rgba(120,150,210,0.25)',
          outlineOffset: 3,
          boxShadow: '0 0 0 9999px rgba(8, 13, 26, 0.72)',
        }}
      >
        <img
          ref={imgRef}
          src={url}
          draggable={false}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            objectPosition: `${pos.x}% ${pos.y}%`,
            userSelect: 'none', display: 'block', pointerEvents: 'none',
          }}
        />
      </div>

      {/* ações */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onClose} style={{
          fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)',
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 9, padding: '9px 24px', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Cancelar
        </button>
        <button onClick={() => { onConfirm(pos); onClose() }} style={{
          fontSize: 13, fontWeight: 600, color: '#fff',
          background: T.brand, border: 'none',
          borderRadius: 9, padding: '9px 24px', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Confirmar
        </button>
      </div>
    </div>
  )
}

/* ─── ProfileHeaderPhotos — estilo LinkedIn ─── */
function ProfileHeaderPhotos({
  logoUrl, coverUrl, logoPosition, coverPosition,
  onLogoSelect, onCoverSelect, onLogoRemove, onCoverRemove,
  onLogoReposition, onCoverReposition,
  savingPhotos, pendingLogo, pendingCover, onSave,
}) {
  const logoInputRef  = useRef()
  const coverInputRef = useRef()

  const makeHandler = (maxMB, onSelect) => (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem'); return }
    if (file.size > maxMB * 1024 * 1024) { toast.error(`Máximo ${maxMB}MB`); return }
    onSelect(file)
    e.target.value = ''
  }

  const overlayBtn = (onClick, children) => (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 600, color: '#fff',
      background: 'rgba(0,0,0,0.52)', border: '1px solid rgba(255,255,255,0.18)',
      backdropFilter: 'blur(4px)',
      borderRadius: 7, padding: '5px 11px', cursor: 'pointer', fontFamily: 'inherit',
    }}>{children}</button>
  )

  return (
    <div>
      {/* ── Capa ─────────────────────────────── */}
      <div style={{
        position: 'relative', width: '100%', height: 200,
        borderRadius: '10px 10px 0 0', overflow: 'hidden',
        background: 'linear-gradient(135deg, #1E2440 0%, #4C60AA 100%)',
      }}>
        {coverUrl && (
          <img src={coverUrl} alt="capa" draggable={false} style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            objectPosition: `${coverPosition?.x ?? 50}% ${coverPosition?.y ?? 50}%`,
          }} />
        )}

        {/* Loader */}
        {savingPhotos && pendingCover && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={22} style={{ color: '#fff', animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {/* Crachá "não salvo" */}
        {pendingCover && !savingPhotos && (
          <span style={{ position: 'absolute', top: 10, left: 10, fontSize: 10, fontWeight: 600, color: T.amber, background: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: '2px 8px' }}>
            não salvo
          </span>
        )}

        {/* Botões da capa — canto superior direito */}
        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
          {coverUrl && overlayBtn(onCoverReposition, <><Move size={10} /> Reposicionar</>)}
          {overlayBtn(() => coverInputRef.current?.click(), <><Camera size={10} /> {coverUrl ? 'Trocar capa' : 'Adicionar capa'}</>)}
          {coverUrl && (
            <button onClick={onCoverRemove} style={{
              width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', background: 'rgba(0,0,0,0.52)', border: '1px solid rgba(255,255,255,0.18)',
              backdropFilter: 'blur(4px)', cursor: 'pointer', padding: 0,
            }}>
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── Strip inferior — avatar overlapping ─ */}
      <div style={{
        background: T.white,
        border: `1px solid ${T.border}`, borderTop: 'none',
        borderRadius: '0 0 10px 10px',
        padding: '0 20px 18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
          {/* Avatar com badge câmera */}
          <div style={{ position: 'relative', marginTop: -44, flexShrink: 0 }}>
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              border: '4px solid #fff',
              background: T.chip, overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}>
              {logoUrl
                ? <img src={logoUrl} alt="perfil" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${logoPosition?.x ?? 50}% ${logoPosition?.y ?? 50}%` }} />
                : <Camera size={24} style={{ color: T.muted, opacity: 0.35 }} />
              }
              {savingPhotos && pendingLogo && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Loader2 size={14} style={{ color: '#fff', animation: 'spin 1s linear infinite' }} />
                </div>
              )}
            </div>
            {/* Badge câmera */}
            <button onClick={() => logoInputRef.current?.click()} style={{
              position: 'absolute', bottom: 3, right: 3,
              width: 26, height: 26, borderRadius: '50%', padding: 0,
              background: T.brand, border: '2.5px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}>
              <Camera size={11} color="#fff" />
            </button>
          </div>

          {/* Info da foto de perfil */}
          <div style={{ paddingBottom: 4, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Foto de perfil</span>
              {pendingLogo && !savingPhotos && <span style={{ fontSize: 10, fontWeight: 600, color: T.amber, background: T.amber + '18', borderRadius: 20, padding: '1px 7px' }}>não salvo</span>}
            </div>
            <p style={{ fontSize: 11, color: T.muted, margin: '0 0 6px' }}>JPG ou PNG · máx 5 MB · recomendado: foto de rosto</p>
            {logoUrl && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onLogoReposition} style={{ fontSize: 11, fontWeight: 500, color: T.brand, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Move size={10} /> Reposicionar
                </button>
                <button onClick={onLogoRemove} style={{ fontSize: 11, fontWeight: 500, color: T.red, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <X size={10} /> Remover
                </button>
              </div>
            )}
          </div>
        </div>

        <p style={{ fontSize: 10, color: T.muted, margin: '10px 0 0' }}>
          Capa recomendada: 1200 × 400 px (proporção 4:1)
        </p>

        {(pendingLogo || pendingCover) && (
          <button onClick={onSave} disabled={savingPhotos} style={{
            marginTop: 12,
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12, fontWeight: 600, color: '#fff',
            background: savingPhotos ? T.muted : T.brand,
            border: 'none', borderRadius: 8, padding: '8px 18px',
            cursor: savingPhotos ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          }}>
            {savingPhotos
              ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</>
              : <><Save size={12} /> Salvar fotos</>}
          </button>
        )}
      </div>

      <input ref={logoInputRef}  type="file" accept="image/*" style={{ display: 'none' }} onChange={makeHandler(5,  onLogoSelect)} />
      <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={makeHandler(10, onCoverSelect)} />
    </div>
  )
}

/* ─── PhotoUpload ────────────────────────────── */
function PhotoUpload({ label, hint, url, uploading, onFileSelect, onRemove, shape = 'square', maxMB = 5, hasPending, position, onReposition }) {
  const inputRef = useRef()
  const isCircle = shape === 'circle'
  const isCover  = shape === 'banner'
  const imgW     = isCircle ? 80 : '100%'
  const imgH     = isCircle ? 80 : isCover ? 160 : 70
  const imgR     = isCircle ? '50%' : 9

  const handleChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem'); return }
    if (file.size > maxMB * 1024 * 1024) { toast.error(`Máximo ${maxMB}MB`); return }
    onFileSelect(file)
    e.target.value = ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{label}</span>
        {hasPending && <span style={{ fontSize: 10, fontWeight: 600, color: T.amber, background: T.amber + '18', borderRadius: 20, padding: '1px 7px' }}>não salvo</span>}
      </div>

      {/* imagem ou placeholder */}
      {url ? (
        <div style={{ position: 'relative', width: imgW, height: imgH, borderRadius: imgR, overflow: 'hidden', flexShrink: 0 }}>
          <img
            src={url} alt={label} draggable={false}
            style={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              objectPosition: `${position?.x ?? 50}% ${position?.y ?? 50}%`,
            }}
          />
          {uploading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={16} style={{ color: '#fff', animation: 'spin 1s linear infinite' }} />
            </div>
          )}
          <button onClick={onReposition} style={{
            position: 'absolute', bottom: 6, right: 6,
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 10, fontWeight: 600, color: '#fff',
            background: 'rgba(0,0,0,0.58)', border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <Move size={9} /> Reposicionar
          </button>
        </div>
      ) : (
        <div style={{
          width: imgW, height: imgH, borderRadius: imgR,
          background: isCover ? 'linear-gradient(135deg, #1E2440 0%, #4C60AA 100%)' : T.bg,
          border: `1.5px dashed ${T.border}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
        }}>
          {isCover
            ? <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Sem foto de capa</span>
            : <Camera size={18} style={{ color: T.muted, opacity: 0.45 }} />
          }
        </div>
      )}

      {/* hint + ações */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: T.muted, flex: 1 }}>{hint}</span>
        <button onClick={() => inputRef.current?.click()} disabled={uploading} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 11, fontWeight: 600, color: T.brand, background: T.chip,
          border: 'none', borderRadius: 7, padding: '5px 10px',
          cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: uploading ? 0.6 : 1, flexShrink: 0,
        }}>
          <Camera size={10} /> {url ? 'Trocar' : 'Adicionar'}
        </button>
        {url && (
          <button onClick={onRemove} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11,
            color: T.red, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, flexShrink: 0,
          }}>
            <X size={10} /> Remover
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleChange} />
    </div>
  )
}

/* ─── ProfilePreview ─────────────────────────── */
function ProfilePreview({ co, logoUrl, coverUrl, logoPosition, coverPosition, category, description, specialties, addressCity, addressDistrict }) {
  const name     = co?.screen_name || `${co?.first_name || ''} ${co?.last_name || ''}`.trim() || co?.name || '—'
  const location = [addressDistrict, addressCity].filter(Boolean).join(', ')
  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', background: T.white }}>
      {/* cover */}
      <div style={{ height: 70, background: 'linear-gradient(135deg, #1E2440, #4C60AA)', position: 'relative', overflow: 'hidden' }}>
        {coverUrl && (
          <img src={coverUrl} alt="capa" style={{
            width: '100%', height: '100%', objectFit: 'cover',
            objectPosition: `${coverPosition?.x ?? 50}% ${coverPosition?.y ?? 50}%`,
          }} />
        )}
        {/* logo badge */}
        <div style={{
          position: 'absolute', bottom: -16, left: 12,
          width: 36, height: 36, borderRadius: 8,
          border: '2.5px solid #fff',
          background: logoUrl ? 'transparent' : T.chip, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {logoUrl
            ? <img src={logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${logoPosition?.x ?? 50}% ${logoPosition?.y ?? 50}%` }} />
            : <span style={{ fontSize: 15, fontWeight: 800, color: T.brand }}>{name.charAt(0).toUpperCase()}</span>
          }
        </div>
      </div>
      <div style={{ padding: '22px 12px 12px' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: '0 0 3px', letterSpacing: '-0.01em' }}>{name}</p>
        {category && <span style={{ fontSize: 10, fontWeight: 600, color: T.brand, background: T.chip, borderRadius: 20, padding: '2px 7px', display: 'inline-block', marginBottom: 5 }}>{category}</span>}
        {specialties?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 5 }}>
            {specialties.slice(0, 3).map(sp => (
              <span key={sp} style={{ fontSize: 10, fontWeight: 500, color: T.muted, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 20, padding: '1px 6px' }}>{sp}</span>
            ))}
          </div>
        )}
        {location && <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: T.muted, fontSize: 11 }}><MapPin size={10} /> {location}</div>}
        {description && <p style={{ fontSize: 11, color: T.muted, margin: '6px 0 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{description}</p>}
      </div>
    </div>
  )
}

/* ─── Shared input style ─────────────────────── */
const inputSx = {
  fontSize: 13, color: 'var(--text-primary)', background: 'var(--surface)',
  border: '1px solid var(--border)', borderRadius: 8,
  padding: '8px 12px', fontFamily: "'Space Grotesk', system-ui, sans-serif",
  outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color 150ms',
}

/* ─── Badge embedável ────────────────────────── */
const BADGE_STYLES = [
  {
    id: 'green',
    label: 'Verde (padrão)',
    preview: { bg: '#16a34a', color: '#fff', border: 'none' },
  },
  {
    id: 'white',
    label: 'Branco',
    preview: { bg: '#fff', color: '#16a34a', border: '1.5px solid #16a34a' },
  },
  {
    id: 'dark',
    label: 'Escuro',
    preview: { bg: '#111827', color: '#fff', border: 'none' },
  },
]

function generateBadgeHtml(slug, name, style) {
  const styles = {
    green: `background:#16a34a;color:#fff;border:none`,
    white: `background:#fff;color:#16a34a;border:1.5px solid #16a34a`,
    dark:  `background:#111827;color:#fff;border:none`,
  }
  const url = `https://orbinutri.com.br/nutricionista/${slug}`
  return `<a href="${url}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:8px;text-decoration:none;font-family:system-ui,sans-serif;font-size:14px;font-weight:600;${styles[style]}">\n  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>\n  Agende comigo no OrbiNutri\n</a>`
}

function BadgeSection({ acct, name }) {
  const [activeStyle, setActiveStyle] = useState('green')
  const [copied, setCopied] = useState(false)

  if (!acct?.id) return null
  const slug = profileSlug(name || acct.company?.screen_name || 'profissional', acct.id)
  const html = generateBadgeHtml(slug, name, activeStyle)

  function copyBadge() {
    navigator.clipboard.writeText(html).then(() => {
      setCopied(true)
      toast.success('Código copiado!')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const st = BADGE_STYLES.find(b => b.id === activeStyle).preview

  return (
    <Panel>
      <SectionHeader label="Badge para seu site" icon={Code} />
      <Divider />
      <div style={{ padding: '14px 20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <p style={{ margin: 0, fontSize: 12, color: T.muted, lineHeight: 1.5 }}>
          Cole o código abaixo no seu site ou blog. Cada clique leva direto ao seu perfil no OrbiNutri.
        </p>

        {/* Preview do badge */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
          <a
            href={`https://orbinutri.com.br/nutricionista/${slug}`}
            target="_blank" rel="noopener noreferrer"
            onClick={e => e.preventDefault()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 8, textDecoration: 'none',
              fontFamily: 'system-ui, sans-serif', fontSize: 14, fontWeight: 600,
              background: st.bg, color: st.color, border: st.border || 'none',
              boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
            }}
          >
            <ExternalLink size={15} />
            Agende comigo no OrbiNutri
          </a>
        </div>

        {/* Seletor de estilo */}
        <div style={{ display: 'flex', gap: 6 }}>
          {BADGE_STYLES.map(b => (
            <button
              key={b.id}
              onClick={() => setActiveStyle(b.id)}
              style={{
                flex: 1, padding: '6px 8px', borderRadius: 7, fontSize: 11, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
                border: activeStyle === b.id ? `2px solid ${T.green}` : `1px solid ${T.border}`,
                background: activeStyle === b.id ? T.green + '10' : T.bg,
                color: activeStyle === b.id ? T.green : T.muted,
              }}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Código HTML */}
        <div style={{ position: 'relative' }}>
          <pre style={{
            margin: 0, padding: '12px 14px', background: '#0f172a', borderRadius: 8,
            fontSize: 11, color: '#94a3b8', overflowX: 'auto', lineHeight: 1.6,
            fontFamily: "'Fira Code', 'Cascadia Code', monospace",
            whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          }}>
            {html}
          </pre>
          <button
            onClick={copyBadge}
            style={{
              position: 'absolute', top: 8, right: 8,
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: copied ? '#16a34a' : '#1e293b',
              color: copied ? '#fff' : '#94a3b8',
              transition: 'all 150ms',
            }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>

        <p style={{ margin: 0, fontSize: 11, color: T.muted }}>
          Funciona em qualquer site, WordPress, Linktree ou e-mail marketing.
        </p>
      </div>
    </Panel>
  )
}

/* ─── Page ───────────────────────────────────── */
export function Vitrine() {
  const isMobile  = useIsMobile()
  const [acct,        setAcct]        = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [savingInfo,  setSavingInfo]  = useState(false)
  const [dirtyInfo,   setDirtyInfo]   = useState(false)
  const [form, setForm] = useState({
    screen_name_natural: '', profession_category: '', directory_description: '',
    instagram_url: '', professional_registration: '', specialties: [], phone_number: '',
    address_city: '', address_district: '', address_state: '',
  })
  const [logoUrl,      setLogoUrl]      = useState(null)
  const [coverUrl,     setCoverUrl]     = useState(null)
  const [pendingLogo,  setPendingLogo]  = useState(null)
  const [pendingCover, setPendingCover] = useState(null)
  const [savingPhotos, setSavingPhotos] = useState(false)
  const [logoPosition,    setLogoPosition]  = useState({ x: 50, y: 50 })
  const [coverPosition,   setCoverPosition] = useState({ x: 50, y: 50 })
  const [repositionTarget, setRepositionTarget] = useState(null) // { type, url, position }

  const co   = acct?.company || {}
  const addr = co.addresses?.[0] || {}
  const displayLogoUrl  = pendingLogo?.preview  ?? logoUrl
  const displayCoverUrl = pendingCover?.preview ?? coverUrl

  const checks  = CHECKS(acct, { ...co, logo_url: displayLogoUrl, cover_url: displayCoverUrl }, form)
  const doneCt  = checks.filter(c => c.done).length
  const pct     = acct ? Math.round((doneCt / checks.length) * 100) : 0
  const barColor = pct >= 80 ? T.green : pct >= 50 ? T.amber : T.red

  const profileUrl  = acct ? `${BASE_URL}/descobrir/${acct.id}` : null
  const bookingUrl  = acct?.booking_token ? `${BASE_URL}/agendar/${acct.booking_token}` : null
  const isActive    = !!acct?.directory_visible
  const profileViews = acct?.profile_views ?? 0
  const specialtyOpts = getSpecialties(form.profession_category)

  const updateForm = (u) => { setForm(f => ({ ...f, ...u })); setDirtyInfo(true) }

  useEffect(() => {
    apiService.getAccountSettings()
      .then(r => {
        const a = r.account
        setAcct(a)
        setLogoUrl(a.company?.logo_url || null)
        setCoverUrl(a.company?.cover_url || null)
        const address = a.company?.addresses?.[0] || {}
        setForm({
          screen_name_natural: a.company?.screen_name_natural || a.company?.screen_name || '',
          profession_category: a.profession_category || '',
          directory_description: a.directory_description || '',
          instagram_url: a.instagram_url || '',
          professional_registration: a.professional_registration || '',
          specialties: a.specialties || [],
          phone_number: a.company?.phone_number || '',
          address_city: address.city || '',
          address_district: address.district || '',
          address_state: address.state || '',
        })
        // restore saved positions
        try {
          const saved = localStorage.getItem(`vpos-${a.id}`)
          if (saved) {
            const { logo, cover } = JSON.parse(saved)
            if (logo)  setLogoPosition(logo)
            if (cover) setCoverPosition(cover)
          }
        } catch {}
      })
      .catch(() => toast.error('Erro ao carregar dados'))
      .finally(() => setLoading(false))
  }, [])

  const handlePositionChange = useCallback((type, pos) => {
    if (type === 'logo')  setLogoPosition(pos)
    else setCoverPosition(pos)
    if (!acct?.id) return
    try {
      const cur = JSON.parse(localStorage.getItem(`vpos-${acct.id}`) || '{}')
      localStorage.setItem(`vpos-${acct.id}`, JSON.stringify({ ...cur, [type]: pos }))
    } catch {}
  }, [acct?.id])

  const buildPayload = (overrides = {}) => ({
    profession_category: form.profession_category,
    directory_description: form.directory_description,
    instagram_url: form.instagram_url,
    professional_registration: form.professional_registration,
    specialties: form.specialties,
    company_attributes: {
      id: co.id,
      screen_name_natural: form.screen_name_natural,
      phone_number: form.phone_number,
      addresses_attributes: [{
        city: form.address_city, district: form.address_district, state: form.address_state,
        country: addr.country || 'BR', ...(addr.id ? { id: addr.id } : {}),
      }],
    },
    ...overrides,
  })

  const toggleVisible = async () => {
    if (!acct) return
    setSaving(true)
    try {
      const next = !acct.directory_visible
      const res = await apiService.updateAccountSettings(buildPayload({ directory_visible: next }))
      setAcct(res.account); setDirtyInfo(false)
      toast.success(next ? 'Vitrine ativada!' : 'Vitrine desativada')
    } catch { toast.error('Erro ao atualizar') }
    finally { setSaving(false) }
  }

  const handleLogoSelect  = (file) => setPendingLogo({ file, preview: URL.createObjectURL(file) })
  const handleCoverSelect = (file) => setPendingCover({ file, preview: URL.createObjectURL(file) })

  const handleSavePhotos = async () => {
    if (!pendingLogo && !pendingCover) return
    setSavingPhotos(true)
    try {
      if (pendingLogo) {
        const res = await apiService.uploadCompanyLogo(pendingLogo.file)
        if (res.logo_url) { setLogoUrl(res.logo_url); setPendingLogo(null) }
      }
      if (pendingCover) {
        const res = await apiService.uploadCompanyCover(pendingCover.file)
        if (res.cover_url) { setCoverUrl(res.cover_url); setPendingCover(null) }
      }
      toast.success('Fotos salvas!')
    } catch { toast.error('Erro ao salvar fotos') }
    finally { setSavingPhotos(false) }
  }

  const handleSaveInfo = async () => {
    setSavingInfo(true)
    try {
      const res = await apiService.updateAccountSettings(buildPayload({ directory_visible: acct?.directory_visible }))
      setAcct(res.account); setDirtyInfo(false)
      toast.success('Informações salvas!')
    } catch { toast.error('Erro ao salvar') }
    finally { setSavingInfo(false) }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 360, ...DISPLAY }}>
        <Loader2 size={22} style={{ color: T.brand, animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, ...DISPLAY }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:.35} }
        .vitrine-field:focus { border-color: ${T.brand} !important; }
        .vitrine-chip-btn:hover { opacity: .85; }
        .checklist-row:hover { background: ${T.bg}; }
      `}</style>

      {/* ══ HEADER ══════════════════════════════════ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: 0, letterSpacing: '-0.03em' }}>
            Minha Vitrine
          </h1>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '2px 8px',
            color: isActive ? T.green : T.muted,
            background: isActive ? T.green + '12' : T.bg,
            border: `1px solid ${isActive ? T.green + '28' : T.border}`,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: isActive ? T.green : '#D1D5DB', flexShrink: 0,
              ...(isActive ? { animation: 'pulse-dot 2s ease-in-out infinite' } : {}),
            }} />
            {isActive ? 'Ativa' : 'Inativa'}
          </span>
        </div>
        {profileUrl && (
          <a href={profileUrl} target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 12, fontWeight: 600, color: T.brand,
            background: T.chip, border: 'none',
            borderRadius: 8, padding: '7px 13px', textDecoration: 'none',
          }}>
            Ver perfil público <ArrowUpRight size={12} />
          </a>
        )}
      </div>

      {/* ══ STATUS BAR — largura total ══════════════ */}
      <Panel style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, padding: '14px 20px', flexWrap: 'wrap',
        ...(isActive ? { borderLeft: `3px solid ${T.green}` } : {}),
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: isActive ? T.green + '14' : T.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Globe size={15} style={{ color: isActive ? T.green : T.muted }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: '0 0 1px' }}>
              {isActive ? 'Visível no Descobrir' : 'Oculto do Descobrir'}
            </p>
            <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>
              {isActive
                ? `${profileViews.toLocaleString('pt-BR')} visualizações · perfil ${pct}% completo`
                : 'Seu perfil não aparece nas buscas públicas'}
            </p>
          </div>
        </div>
        <button onClick={toggleVisible} disabled={saving} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
          fontSize: 12, fontWeight: 600,
          color: isActive ? T.red : T.green,
          background: isActive ? T.red + '10' : T.green + '10',
          border: `1px solid ${isActive ? T.red + '20' : T.green + '20'}`,
          borderRadius: 8, padding: '7px 14px',
          cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          opacity: saving ? 0.6 : 1, transition: 'all 150ms',
        }}>
          {saving ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : isActive ? <EyeOff size={12} /> : <Eye size={12} />}
          {isActive ? 'Desativar' : 'Ativar vitrine'}
        </button>
      </Panel>

      {/* ══ COMO FUNCIONA — só quando inativa ═══════ */}
      {!isActive && (
        <Panel style={{ padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 16 }}>
            {[
              { n: '01', t: 'Paciente busca sua profissão ou nome' },
              { n: '02', t: 'Encontra seu perfil no diretório' },
              { n: '03', t: 'Agenda online sem precisar te ligar' },
              { n: '04', t: 'Você atende um novo paciente' },
            ].map(s => (
              <div key={s.n} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.brand, letterSpacing: '0.06em' }}>{s.n}</span>
                <div style={{ height: 2, width: 20, background: T.brand, borderRadius: 2, opacity: 0.35 }} />
                <p style={{ fontSize: 12, color: T.muted, margin: 0, lineHeight: 1.5 }}>{s.t}</p>
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 16, paddingTop: 14 }}>
            <button onClick={toggleVisible} disabled={saving} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 600, color: '#fff', background: T.brand,
              border: 'none', borderRadius: 8, padding: '8px 18px',
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1,
            }}>
              {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Globe size={13} />}
              Ativar minha vitrine
            </button>
          </div>
        </Panel>
      )}

      {/* ══ GRID PRINCIPAL 3fr | 2fr ════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr', gap: 10, alignItems: 'start' }}>

        {/* ── COLUNA ESQUERDA (edição) ───────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Fotos */}
          <Panel id="vitrine-photos" style={{ overflow: 'visible' }}>
            <SectionHeader label="Fotos do perfil" icon={ImageIcon} />
            <Divider />
            <div style={{ padding: '0 0 0' }}>
              <ProfileHeaderPhotos
                logoUrl={displayLogoUrl}
                coverUrl={displayCoverUrl}
                logoPosition={logoPosition}
                coverPosition={coverPosition}
                onLogoSelect={handleLogoSelect}
                onCoverSelect={handleCoverSelect}
                onLogoRemove={() => { setPendingLogo(null); setLogoUrl(null) }}
                onCoverRemove={() => { setPendingCover(null); setCoverUrl(null) }}
                onLogoReposition={() => setRepositionTarget({ type: 'logo', url: displayLogoUrl, position: logoPosition })}
                onCoverReposition={() => setRepositionTarget({ type: 'cover', url: displayCoverUrl, position: coverPosition })}
                savingPhotos={savingPhotos}
                pendingLogo={!!pendingLogo}
                pendingCover={!!pendingCover}
                onSave={handleSavePhotos}
              />
            </div>
          </Panel>

          {/* Informações + Contato */}
          <Panel id="vitrine-info">
            <SectionHeader label="Informações e contato" icon={User} />
            <Divider />
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Nome */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: T.muted }}>Nome de exibição</label>
                <input
                  className="vitrine-field"
                  value={form.screen_name_natural}
                  onChange={e => updateForm({ screen_name_natural: e.target.value })}
                  placeholder={co.name || 'Ex: Dra. Ana Lima'}
                  style={inputSx}
                />
                <span style={{ fontSize: 11, color: T.muted }}>Como você aparece no Descobrir. Se vazio, usa o nome da empresa.</span>
              </div>

              {/* Categoria */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: T.muted }}>Categoria profissional</label>
                <select
                  className="vitrine-field"
                  value={form.profession_category}
                  onChange={e => updateForm({ profession_category: e.target.value, specialties: [] })}
                  style={{ ...inputSx, maxWidth: 280 }}
                >
                  <option value="">Selecione uma categoria</option>
                  {['Nutricionista','Fisioterapeuta','Psicólogo','Personal Trainer','Médico','Dentista','Fonoaudiólogo','Terapeuta','Professor','Coach','Advogado','Contador','Veterinário','Designer','Outro'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Descrição */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: T.muted }}>Descrição pública</label>
                <textarea
                  className="vitrine-field"
                  value={form.directory_description}
                  onChange={e => updateForm({ directory_description: e.target.value })}
                  rows={3}
                  placeholder="Descreva sua especialidade, forma de atendimento, diferenciais..."
                  style={{ ...inputSx, resize: 'vertical', lineHeight: 1.5 }}
                />
              </div>

              {/* Instagram */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Instagram size={11} style={{ color: '#E1306C' }} /> Instagram
                </label>
                <input
                  className="vitrine-field"
                  value={form.instagram_url}
                  onChange={e => updateForm({ instagram_url: e.target.value })}
                  placeholder="https://instagram.com/seuperfil"
                  style={inputSx}
                />
              </div>

              {/* Registro profissional */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: T.muted }}>Registro profissional</label>
                <input
                  className="vitrine-field"
                  value={form.professional_registration}
                  onChange={e => updateForm({ professional_registration: e.target.value })}
                  placeholder="Ex: CRN-2 12345/P"
                  style={inputSx}
                />
              </div>

              {/* Especialidades */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: T.muted }}>
                  Especialidades{form.profession_category && ` · ${form.profession_category}`}
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {specialtyOpts.map(sp => {
                    const active = form.specialties.includes(sp)
                    return (
                      <button key={sp} type="button" className="vitrine-chip-btn"
                        onClick={() => updateForm({ specialties: active ? form.specialties.filter(s => s !== sp) : [...form.specialties, sp] })}
                        style={{
                          fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 20,
                          border: `1px solid ${active ? T.brand : T.border}`,
                          background: active ? T.brand : 'transparent',
                          color: active ? '#fff' : T.muted,
                          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 120ms',
                        }}>
                        {sp}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Divisor Contato */}
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Telefone */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Phone size={10} /> Telefone / WhatsApp
                  </label>
                  <input
                    id="vitrine-phone"
                    className="vitrine-field"
                    value={form.phone_number}
                    onChange={e => updateForm({ phone_number: e.target.value })}
                    placeholder="(11) 99999-9999"
                    type="tel"
                    style={{ ...inputSx, maxWidth: 220 }}
                  />
                </div>

                {/* Localização */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <MapPin size={10} /> Localização
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 72px', gap: 8 }}>
                    {[
                      { label: 'Cidade', key: 'address_city', placeholder: 'São Paulo', id: 'vitrine-city' },
                      { label: 'Bairro', key: 'address_district', placeholder: 'Pinheiros' },
                      { label: 'Estado', key: 'address_state', placeholder: 'SP', max: 2 },
                    ].map(f => (
                      <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ fontSize: 10, color: T.muted, fontWeight: 500 }}>{f.label}</span>
                        <input
                          id={f.id}
                          className="vitrine-field"
                          value={form[f.key]}
                          onChange={e => updateForm({ [f.key]: f.max ? e.target.value.toUpperCase().slice(0, f.max) : e.target.value })}
                          placeholder={f.placeholder}
                          maxLength={f.max}
                          style={inputSx}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botão salvar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 2 }}>
                <button onClick={handleSaveInfo} disabled={savingInfo} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 600,
                  color: dirtyInfo ? '#fff' : T.muted,
                  background: dirtyInfo ? T.brand : T.bg,
                  border: `1px solid ${dirtyInfo ? 'transparent' : T.border}`,
                  borderRadius: 8, padding: '8px 16px',
                  cursor: savingInfo ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
                }}>
                  {savingInfo
                    ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</>
                    : dirtyInfo
                    ? <><Save size={12} /> Salvar alterações</>
                    : <><Check size={12} /> Tudo salvo</>}
                </button>
                {dirtyInfo && !savingInfo && (
                  <span style={{ fontSize: 11, color: T.amber, fontWeight: 500 }}>Alterações não salvas</span>
                )}
              </div>
            </div>
          </Panel>
        </div>

        {/* ── COLUNA DIREITA (status / métricas / preview) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Preview ao vivo */}
          <Panel>
            <SectionHeader label="Pré-visualização" icon={Globe} />
            <Divider />
            <div style={{ padding: '14px 16px 16px' }}>
              <ProfilePreview
                co={co}
                logoUrl={displayLogoUrl} coverUrl={displayCoverUrl}
                logoPosition={logoPosition} coverPosition={coverPosition}
                category={form.profession_category} description={form.directory_description}
                specialties={form.specialties} addressCity={form.address_city} addressDistrict={form.address_district}
              />
              {profileUrl && (
                <a href={profileUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  fontSize: 11, fontWeight: 600, color: T.brand,
                  background: T.chip, border: 'none', borderRadius: 8,
                  padding: '7px 0', textDecoration: 'none', marginTop: 10,
                }}>
                  <ExternalLink size={11} /> Ver perfil completo
                </a>
              )}
            </div>
          </Panel>

          {/* Completude do perfil */}
          <Panel>
            <SectionHeader label="Completude do perfil" icon={BarChart2}
              right={<span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>{doneCt}/{checks.length}</span>}
            />
            <Divider />
            <div style={{ padding: '14px 20px 16px' }}>
              {/* Barra */}
              <div style={{ height: 4, borderRadius: 99, background: T.bg, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: barColor, transition: 'width 500ms ease' }} />
              </div>
              {/* Checklist — 2 colunas na sidebar */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px' }}>
                {checks.map(c => {
                  const scrollInfo   = () => document.getElementById('vitrine-info')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  const scrollPhotos = () => document.getElementById('vitrine-photos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  const clickMap = {
                    visible: () => !c.done && toggleVisible(),
                    logo: scrollPhotos, cover: scrollPhotos,
                    category: scrollInfo, description: scrollInfo,
                    instagram: scrollInfo, specialties: scrollInfo,
                    city: scrollInfo, phone: scrollInfo,
                  }
                  return (
                    <div key={c.key} onClick={!c.done ? clickMap[c.key] : undefined}
                      className={!c.done ? 'checklist-row' : ''}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        cursor: !c.done ? 'pointer' : 'default',
                        padding: '4px 5px', borderRadius: 6, transition: 'background 120ms',
                      }}>
                      <div style={{
                        width: 15, height: 15, borderRadius: '50%', flexShrink: 0,
                        background: c.done ? T.green : 'transparent',
                        border: `1.5px solid ${c.done ? T.green : T.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {c.done && <Check size={8} color="#fff" strokeWidth={3} />}
                      </div>
                      <span style={{ fontSize: 11, color: c.done ? T.muted : T.text, fontWeight: c.done ? 400 : 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.label}
                      </span>
                      {!c.done && <ChevronRight size={10} style={{ color: T.border, flexShrink: 0 }} />}
                    </div>
                  )
                })}
              </div>
            </div>
          </Panel>

          {/* CTA 100% */}
          {pct === 100 && isActive && (
            <Panel style={{ padding: '14px 16px', background: T.green + '08', border: `1px solid ${T.green + '28'}`, borderLeft: `3px solid ${T.green}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={16} style={{ color: T.green, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#15803D', margin: '0 0 2px' }}>Perfil 100% completo!</p>
                  <p style={{ fontSize: 11, color: '#166534', margin: 0 }}>Compartilhe seu link e atraia novos pacientes.</p>
                </div>
              </div>
            </Panel>
          )}

          {/* Links de compartilhamento */}
          {(profileUrl || bookingUrl) && (
            <Panel>
              <SectionHeader label="Compartilhe sua vitrine" icon={Share2} />
              <Divider />
              <div style={{ padding: '14px 20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {profileUrl && <CopyField label="Perfil público" value={profileUrl} />}
                {bookingUrl && <CopyField label="Link de agendamento" value={bookingUrl} />}
                {acct?.id && <CopyField label="Link para avaliação" value={`${BASE_URL}/avaliar/${acct.id}`} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginTop: 2 }}>
                  <span style={{ fontSize: 10, color: T.muted }}>Cole em:</span>
                  {['Bio do Instagram', 'WhatsApp', 'E-mail', 'Cartão de visitas'].map(t => (
                    <span key={t} style={{ fontSize: 10, color: T.muted, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 20, padding: '2px 8px' }}>{t}</span>
                  ))}
                </div>
              </div>
            </Panel>
          )}

          {/* Badge embedável */}
          <BadgeSection acct={acct} name={form.screen_name_natural || co.screen_name} />
        </div>
      </div>
    </div>

    {repositionTarget && (
      <RepositionModal
        url={repositionTarget.url}
        shape={repositionTarget.type === 'logo' ? 'circle' : 'banner'}
        initialPosition={repositionTarget.position}
        onConfirm={pos => handlePositionChange(repositionTarget.type, pos)}
        onClose={() => setRepositionTarget(null)}
      />
    )}
    </>
  )
}
