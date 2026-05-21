import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Copy, Check, ExternalLink, Loader2, Eye, EyeOff, MapPin, Phone, Mail, X, Save } from 'lucide-react'
import { apiService } from '../lib/api'
import { toast } from 'sonner'
import { T, DISPLAY } from '@/lib/tokens'
import { useIsMobile } from '@/hooks/use-mobile'

const BASE_URL = import.meta.env.VITE_PUBLIC_URL || window.location.origin

/* ─── Layout tokens ───────────────────────────── */
const CHECKS = (acct, co, addr) => [
  { key: 'visible',     label: 'Visível na vitrine',       done: !!acct?.directory_visible,    hint: 'Ative a visibilidade abaixo' },
  { key: 'category',    label: 'Categoria profissional',   done: !!acct?.profession_category,   hint: 'Informe sua categoria' },
  { key: 'description', label: 'Descrição da vitrine',     done: !!acct?.directory_description, hint: 'Escreva sobre você' },
  { key: 'logo',        label: 'Foto de perfil',           done: !!co?.logo_url,               hint: 'Adicione sua foto' },
  { key: 'cover',       label: 'Foto de capa',             done: !!co?.cover_url,              hint: 'Adicione uma foto de capa' },
  { key: 'city',        label: 'Cidade / endereço',        done: !!(addr?.city),               hint: 'Informe sua localização' },
  { key: 'phone',       label: 'Telefone de contato',      done: !!(co?.phone_number),         hint: 'Adicione um telefone' },
]

function Panel({ children, style }) {
  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, ...style }}>
      {children}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted, margin: '0 0 14px' }}>
      {children}
    </p>
  )
}

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div>
      <p style={{ fontSize: 12, color: T.muted, margin: '0 0 5px', fontWeight: 600 }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          flex: 1, fontSize: 13, color: T.text, background: T.bg,
          border: `1px solid ${T.border}`, borderRadius: 8,
          padding: '8px 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontFamily: 'monospace',
        }}>
          {value}
        </div>
        <button
          onClick={copy}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
            fontSize: 12, fontWeight: 600, color: copied ? T.green : T.brand,
            background: copied ? T.green + '15' : T.chip,
            border: `1px solid ${copied ? T.green + '40' : '#DDE3F5'}`,
            borderRadius: 7, padding: '8px 12px', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 150ms',
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
    </div>
  )
}

function PhotoUpload({ label, hint, url, uploading, onFileSelect, onRemove, shape = 'square', accept = 'image/*', maxMB = 5, hasPending }) {
  const inputRef = useRef()
  const isCircle = shape === 'circle'
  const [imgErr, setImgErr] = useState(false)
  useEffect(() => { setImgErr(false) }, [url])

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>{label}</p>
        {hasPending && (
          <span style={{ fontSize: 11, fontWeight: 600, color: T.amber, background: T.amber + '22', borderRadius: 20, padding: '1px 7px' }}>
            não salvo
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Preview */}
        <div style={{
          width: isCircle ? 72 : 120, height: 72,
          borderRadius: isCircle ? '50%' : 10,
          background: url ? 'transparent' : (isCircle ? '#EEF2FA' : 'linear-gradient(135deg, #1E2440, #4C60AA)'),
          border: `2px ${url ? 'solid' : 'dashed'} var(--border)`,
          overflow: 'hidden', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          {url && !imgErr && (
            <img
              src={url}
              alt={label}
              onError={() => setImgErr(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
          {!url && !isCircle && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textAlign: 'center', padding: '0 6px' }}>
              Sem capa
            </span>
          )}
          {uploading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={18} style={{ color: '#fff', animation: 'spin 1s linear infinite' }} />
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 600, color: '#4C60AA',
              background: '#EEF2FA', border: 'none', borderRadius: 8,
              padding: '7px 14px', cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              opacity: uploading ? 0.6 : 1,
            }}
          >
            <Camera size={14} />
            {url ? 'Trocar' : 'Adicionar'}
          </button>
          {url && (
            <button
              onClick={onRemove}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 12, color: T.red, background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: 'inherit', padding: '2px 0',
              }}
            >
              <X size={11} /> Remover
            </button>
          )}
          <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>
            {hint}
          </p>
        </div>
      </div>
      <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }} onChange={handleChange} />
    </div>
  )
}

/* ─── Vitrine preview card ───────────────────── */
function ProfilePreview({ acct, co, addr, logoUrl, coverUrl }) {
  const name = co?.screen_name || `${co?.first_name || ''} ${co?.last_name || ''}`.trim() || co?.name || '—'
  const city = addr?.city || ''
  const district = addr?.district || ''
  const location = [district, city].filter(Boolean).join(', ')

  return (
    <div style={{
      border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden',
      maxWidth: 300, background: T.white,
    }}>
      {/* Cover */}
      <div style={{
        height: 80,
        background: coverUrl ? 'transparent' : 'linear-gradient(135deg, #1E2440, #4C60AA)',
        position: 'relative',
      }}>
        {coverUrl && <img src={coverUrl} alt="capa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        {/* Logo overlap */}
        <div style={{
          position: 'absolute', bottom: -20, left: 16,
          width: 44, height: 44, borderRadius: 10,
          border: '3px solid var(--background, #fff)',
          background: logoUrl ? 'transparent' : '#EEF2FA',
          overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {logoUrl
            ? <img src={logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 18, fontWeight: 800, color: '#4C60AA' }}>{name.charAt(0).toUpperCase()}</span>
          }
        </div>
      </div>

      <div style={{ padding: '28px 16px 16px' }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: '0 0 2px', letterSpacing: '-0.02em' }}>{name}</p>
        {acct?.profession_category && (
          <span style={{
            fontSize: 11, fontWeight: 600, color: '#4C60AA',
            background: '#EEF2FA', borderRadius: 20, padding: '2px 8px',
            display: 'inline-block', marginBottom: 6,
          }}>
            {acct.profession_category}
          </span>
        )}
        {location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.muted, fontSize: 12 }}>
            <MapPin size={11} />
            {location}
          </div>
        )}
        {acct?.directory_description && (
          <p style={{ fontSize: 12, color: T.muted, margin: '8px 0 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {acct.directory_description}
          </p>
        )}
      </div>
    </div>
  )
}

/* ─── Page ───────────────────────────────────── */
export function Vitrine() {
  const navigate  = useNavigate()
  const isMobile  = useIsMobile()
  const [acct,       setAcct]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [savingInfo, setSavingInfo] = useState(false)
  const [form,       setForm]       = useState({ screen_name_natural: '', profession_category: '', directory_description: '' })

  // URLs salvas na API
  const [logoUrl,  setLogoUrl]  = useState(null)
  const [coverUrl, setCoverUrl] = useState(null)

  // Arquivos pendentes (selecionados mas ainda não enviados)
  const [pendingLogo,  setPendingLogo]  = useState(null) // { file, preview }
  const [pendingCover, setPendingCover] = useState(null) // { file, preview }
  const [savingPhotos, setSavingPhotos] = useState(false)

  const co   = acct?.company || {}
  const addr = co.addresses?.[0] || {}

  const displayLogoUrl  = pendingLogo?.preview  ?? logoUrl
  const displayCoverUrl = pendingCover?.preview ?? coverUrl

  const checks = CHECKS(acct, { ...co, logo_url: displayLogoUrl, cover_url: displayCoverUrl }, addr)
  const done  = checks.filter(c => c.done).length
  const total = checks.length
  const pct   = acct ? Math.round((done / total) * 100) : 0

  const profileUrl = acct ? `${BASE_URL}/descobrir/${acct.id}` : null
  const bookingUrl = acct?.booking_token ? `${BASE_URL}/agendar/${acct.booking_token}` : null

  useEffect(() => {
    apiService.getAccountSettings()
      .then(r => {
        const a = r.account
        setAcct(a)
        setLogoUrl(a.company?.logo_url || null)
        setCoverUrl(a.company?.cover_url || null)
        setForm({
          screen_name_natural: a.company?.screen_name_natural || a.company?.screen_name || '',
          profession_category: a.profession_category || '',
          directory_description: a.directory_description || '',
        })
      })
      .catch(() => toast.error('Erro ao carregar dados'))
      .finally(() => setLoading(false))
  }, [])

  const toggleVisible = async () => {
    if (!acct) return
    setSaving(true)
    try {
      const next = !acct.directory_visible
      const res = await apiService.updateAccountSettings({
        directory_visible: next,
        profession_category: form.profession_category,
        directory_description: form.directory_description,
        company_attributes: { id: co.id, screen_name_natural: form.screen_name_natural },
      })
      setAcct(res.account)
      toast.success(next ? 'Vitrine ativada!' : 'Vitrine desativada')
    } catch { toast.error('Erro ao atualizar') }
    finally { setSaving(false) }
  }

  const handleLogoSelect = (file) => {
    setPendingLogo({ file, preview: URL.createObjectURL(file) })
  }

  const handleCoverSelect = (file) => {
    setPendingCover({ file, preview: URL.createObjectURL(file) })
  }

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
      const res = await apiService.updateAccountSettings({
        directory_visible: acct?.directory_visible,
        profession_category: form.profession_category,
        directory_description: form.directory_description,
        company_attributes: { id: co.id, screen_name_natural: form.screen_name_natural },
      })
      setAcct(res.account)
      toast.success('Informações salvas!')
    } catch { toast.error('Erro ao salvar') }
    finally { setSavingInfo(false) }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 360, ...DISPLAY }}>
        <Loader2 size={24} style={{ color: T.brand, animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const barColor = pct >= 80 ? T.green : pct >= 50 ? T.amber : T.red

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 860, ...DISPLAY }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0, letterSpacing: '-0.03em' }}>
            Minha Vitrine
          </h1>
          <p style={{ fontSize: 13, color: T.muted, margin: '3px 0 0' }}>
            Gerencie como você aparece no diretório público
          </p>
        </div>
        {profileUrl && (
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 600, color: T.brand,
              background: T.chip, border: `1px solid #DDE3F5`,
              borderRadius: 8, padding: '8px 16px', textDecoration: 'none',
            }}
          >
            <ExternalLink size={13} /> Ver perfil público
          </a>
        )}
      </div>

      {/* Status + toggle */}
      <Panel style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
            background: acct?.directory_visible ? T.green : '#D1D5DB',
            boxShadow: acct?.directory_visible ? `0 0 0 3px ${T.green}30` : 'none',
          }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>
              {acct?.directory_visible ? 'Visível no Descobrir' : 'Oculto do Descobrir'}
            </p>
            <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>
              {acct?.directory_visible
                ? 'Novos clientes podem encontrar você pelo diretório'
                : 'Seu perfil não aparece nas buscas públicas'}
            </p>
          </div>
        </div>
        <button
          onClick={toggleVisible}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0,
            fontSize: 13, fontWeight: 600,
            color: acct?.directory_visible ? T.red : T.green,
            background: acct?.directory_visible ? '#FEE2E2' : '#DCFCE7',
            border: 'none', borderRadius: 8, padding: '9px 16px',
            cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving
            ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
            : acct?.directory_visible ? <EyeOff size={13} /> : <Eye size={13} />}
          {acct?.directory_visible ? 'Desativar' : 'Ativar vitrine'}
        </button>
      </Panel>

      {/* Completude */}
      <Panel style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <SectionTitle>Completude do perfil</SectionTitle>
          <span style={{ fontSize: 13, fontWeight: 700, color: barColor }}>{pct}%</span>
        </div>
        <div style={{ height: 7, borderRadius: 99, background: T.bg, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: barColor, transition: 'width 500ms ease' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px 20px' }}>
          {checks.map(c => (
            <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                background: c.done ? T.green : T.bg,
                border: `2px solid ${c.done ? T.green : T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {c.done && <Check size={9} color="#fff" strokeWidth={3} />}
              </div>
              <span style={{ fontSize: 13, color: c.done ? T.text : T.muted, textDecoration: c.done ? 'none' : 'none' }}>
                {c.label}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Fotos + preview — row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1fr) auto', gap: 12, alignItems: 'start' }}>

        {/* Fotos */}
        <Panel style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SectionTitle>Fotos</SectionTitle>

          <PhotoUpload
            label="Foto de perfil"
            hint="JPG, PNG ou WebP · max 5MB"
            url={displayLogoUrl}
            uploading={savingPhotos && !!pendingLogo}
            shape="circle"
            onFileSelect={handleLogoSelect}
            onRemove={() => { setPendingLogo(null); setLogoUrl(null) }}
            hasPending={!!pendingLogo}
          />

          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 20 }}>
            <PhotoUpload
              label="Foto de capa"
              hint="Imagem horizontal · max 10MB"
              url={displayCoverUrl}
              uploading={savingPhotos && !!pendingCover}
              shape="banner"
              maxMB={10}
              onFileSelect={handleCoverSelect}
              onRemove={() => { setPendingCover(null); setCoverUrl(null) }}
              hasPending={!!pendingCover}
            />
          </div>

          {(pendingLogo || pendingCover) && (
            <button
              onClick={handleSavePhotos}
              disabled={savingPhotos}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                fontSize: 13, fontWeight: 600, color: '#fff',
                background: savingPhotos ? T.muted : T.brand,
                border: 'none', borderRadius: 8, padding: '10px 20px',
                cursor: savingPhotos ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                transition: 'background 150ms',
              }}
            >
              {savingPhotos
                ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</>
                : <><Save size={13} /> Salvar fotos</>}
            </button>
          )}
        </Panel>

        {/* Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted, margin: 0 }}>
            Pré-visualização
          </p>
          <ProfilePreview acct={acct} co={co} addr={addr} logoUrl={displayLogoUrl} coverUrl={displayCoverUrl} />
        </div>
      </div>

      {/* Informações da vitrine */}
      <Panel style={{ padding: '18px 20px' }}>
        <SectionTitle>Informações</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: 'inherit' }}>
              Nome de exibição
            </label>
            <input
              value={form.screen_name_natural}
              onChange={e => setForm(f => ({ ...f, screen_name_natural: e.target.value }))}
              placeholder={co.name || 'Ex: Dr. João Silva'}
              style={{
                fontSize: 13, color: T.text, background: T.bg,
                border: `1px solid ${T.border}`, borderRadius: 8,
                padding: '8px 12px', fontFamily: 'inherit', outline: 'none',
              }}
            />
            <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>
              Como você aparece no Descobrir. Se vazio, usa o nome da empresa.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: 'inherit' }}>
              Categoria profissional
            </label>
            <select
              value={form.profession_category}
              onChange={e => setForm(f => ({ ...f, profession_category: e.target.value }))}
              style={{
                fontSize: 13, color: T.text, background: T.bg,
                border: `1px solid ${T.border}`, borderRadius: 8,
                padding: '8px 12px', fontFamily: 'inherit', outline: 'none', maxWidth: 280,
              }}
            >
              <option value="">Selecione uma categoria</option>
              {[
                'Nutricionista', 'Fisioterapeuta', 'Psicólogo', 'Personal Trainer',
                'Médico', 'Dentista', 'Fonoaudiólogo', 'Terapeuta',
                'Professor', 'Coach', 'Advogado', 'Contador', 'Veterinário',
                'Designer', 'Outro',
              ].map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: 'inherit' }}>
              Descrição pública
            </label>
            <textarea
              value={form.directory_description}
              onChange={e => setForm(f => ({ ...f, directory_description: e.target.value }))}
              rows={3}
              placeholder="Descreva sua especialidade, forma de atendimento, diferenciais..."
              style={{
                fontSize: 13, color: T.text, background: T.bg,
                border: `1px solid ${T.border}`, borderRadius: 8,
                padding: '8px 12px', fontFamily: 'inherit', outline: 'none',
                resize: 'vertical', lineHeight: 1.5,
              }}
            />
            <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>
              Aparece no seu perfil público para clientes em potencial.
            </p>
          </div>

          <button
            onClick={handleSaveInfo}
            disabled={savingInfo}
            style={{
              alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 7,
              fontSize: 13, fontWeight: 600, color: '#fff',
              background: savingInfo ? T.muted : T.brand,
              border: 'none', borderRadius: 8, padding: '9px 18px',
              cursor: savingInfo ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              transition: 'background 150ms',
            }}
          >
            {savingInfo
              ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</>
              : <><Save size={13} /> Salvar informações</>}
          </button>
        </div>
      </Panel>

      {/* Links para compartilhar */}
      {(profileUrl || bookingUrl) && (
        <Panel style={{ padding: '18px 20px' }}>
          <SectionTitle>Links para compartilhar</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {profileUrl && <CopyField label="Perfil público" value={profileUrl} />}
            {bookingUrl && <CopyField label="Link de agendamento" value={bookingUrl} />}
          </div>
        </Panel>
      )}

      {/* Contato público */}
      {(co.phone_number || co.email) && (
        <Panel style={{ padding: '18px 20px' }}>
          <SectionTitle>Contato exibido no perfil</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {co.phone_number && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.text }}>
                <Phone size={14} style={{ color: T.muted }} /> {co.phone_number}
              </div>
            )}
            {co.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.text }}>
                <Mail size={14} style={{ color: T.muted }} /> {co.email}
              </div>
            )}
            <button
              onClick={() => navigate('/company-settings')}
              style={{
                alignSelf: 'flex-start', marginTop: 4,
                fontSize: 12, fontWeight: 600, color: T.brand,
                background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0,
              }}
            >
              Editar contato →
            </button>
          </div>
        </Panel>
      )}
    </div>
  )
}
