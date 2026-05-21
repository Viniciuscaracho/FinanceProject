import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, CheckCircle2, ClipboardList, Send, Edit2 } from 'lucide-react'
import { apiService } from '@/lib/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function FieldInput({ field, value, onChange }) {
  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box',
    fontFamily: 'inherit', background: '#fff', outline: 'none', color: '#111827',
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        rows={3}
        required={field.required}
        style={{ ...inputStyle, resize: 'vertical' }}
      />
    )
  }

  if (field.type === 'select') {
    return (
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        required={field.required}
        style={{ ...inputStyle, cursor: 'pointer' }}
      >
        <option value="">Selecione…</option>
        {(field.options || []).map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    )
  }

  if (field.type === 'checkbox') {
    return (
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        {['Sim', 'Não'].map(opt => (
          <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
            <input
              type="radio"
              name={`field_${field.id}`}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              required={field.required}
              style={{ accentColor: '#7C3AED' }}
            />
            {opt}
          </label>
        ))}
      </div>
    )
  }

  if (field.type === 'date') {
    return (
      <input
        type="date"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        required={field.required}
        style={inputStyle}
      />
    )
  }

  return (
    <input
      type={field.type === 'number' ? 'number' : 'text'}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      required={field.required}
      style={inputStyle}
    />
  )
}

export function PublicAnamneseForm() {
  const { token } = useParams()
  const [state, setState] = useState('loading') // loading | form | success | error | already_filled
  const [data, setData]   = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    apiService.getPublicAnamnese(token)
      .then(res => {
        setData(res)
        if (res.filled) {
          setAnswers(res.response?.responses || {})
          setState('already_filled')
        } else {
          setState('form')
        }
      })
      .catch(() => setState('error'))
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await apiService.submitPublicAnamnese(token, {
        anamnese_template_id: data?.template?.id,
        responses: answers,
      })
      setState('success')
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao enviar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const brandColor = '#7C3AED'

  const Container = ({ children }) => (
    <div style={{
      minHeight: '100vh', background: '#F9FAFB',
      display: 'flex', justifyContent: 'center', padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 48, height: 48, borderRadius: 14, background: brandColor, marginBottom: 10,
          }}>
            <ClipboardList size={24} color="#fff" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#111' }}>Anamnese</h1>
          {data?.appointment && (
            <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0' }}>
              {data.appointment.service_name}
              {data.appointment.start_time && ` · ${format(new Date(data.appointment.start_time), "dd 'de' MMMM", { locale: ptBR })}`}
              {data.appointment.professional && ` · ${data.appointment.professional}`}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  )

  if (state === 'loading') {
    return (
      <Container>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <Loader2 size={28} style={{ color: brandColor, animation: 'spin 1s linear infinite' }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </Container>
    )
  }

  if (state === 'error') {
    return (
      <Container>
        <div style={{ background: '#fff', borderRadius: 16, padding: '40px 28px', textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
          <p style={{ fontSize: 15, color: '#EF4444', fontWeight: 600 }}>Link inválido ou expirado</p>
          <p style={{ fontSize: 13, color: '#888', marginTop: 8 }}>Solicite um novo link ao seu profissional.</p>
        </div>
      </Container>
    )
  }

  if (state === 'success') {
    return (
      <Container>
        <div style={{ background: '#fff', borderRadius: 16, padding: '48px 28px', textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
          <CheckCircle2 size={48} style={{ color: '#10B981', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#111' }}>Anamnese enviada!</h2>
          <p style={{ fontSize: 14, color: '#666', margin: 0 }}>
            Suas respostas foram salvas. O seu profissional terá acesso antes da consulta.
          </p>
        </div>
      </Container>
    )
  }

  if (state === 'already_filled') {
    return (
      <Container>
        <div style={{ background: '#fff', borderRadius: 16, padding: '32px 28px', boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <CheckCircle2 size={20} style={{ color: '#10B981', flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>Anamnese já preenchida</p>
              <p style={{ fontSize: 12, color: '#888', margin: 0 }}>Você pode atualizar suas respostas abaixo se necessário.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <FieldList template={data?.template} answers={answers} setAnswers={setAnswers} />
            {errorMsg && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 12 }}>{errorMsg}</p>}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                background: brandColor, color: '#fff', fontSize: 15, fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer', marginTop: 24,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'inherit', opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Edit2 size={16} />}
              Atualizar respostas
            </button>
          </form>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </Container>
    )
  }

  // state === 'form'
  return (
    <Container>
      <div style={{ background: '#fff', borderRadius: 16, padding: '28px', boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
        {data?.template && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: '#111' }}>{data.template.name}</h2>
            {data.template.description && (
              <p style={{ fontSize: 13, color: '#777', margin: 0 }}>{data.template.description}</p>
            )}
          </div>
        )}

        {!data?.template && (
          <p style={{ fontSize: 14, color: '#888', textAlign: 'center', padding: '24px 0' }}>
            Nenhum formulário disponível para este agendamento.
          </p>
        )}

        {data?.template && (
          <form onSubmit={handleSubmit}>
            <FieldList template={data.template} answers={answers} setAnswers={setAnswers} />
            {errorMsg && <p style={{ color: '#EF4444', fontSize: 13, marginTop: 12 }}>{errorMsg}</p>}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%', padding: '14px', borderRadius: 10, border: 'none',
                background: brandColor, color: '#fff', fontSize: 15, fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer', marginTop: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'inherit', opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting
                ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                : <Send size={16} />}
              Enviar anamnese
            </button>
          </form>
        )}
      </div>
      <p style={{ fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 16 }}>
        Suas respostas são confidenciais e acessadas apenas pelo seu profissional.
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </Container>
  )
}

function FieldList({ template, answers, setAnswers }) {
  if (!template?.fields?.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {template.fields.map((field, idx) => {
        const key = field.id || field.label || idx
        return (
          <div key={key}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#222', marginBottom: 6 }}>
              {field.label}
              {field.required && <span style={{ color: '#EF4444', marginLeft: 3 }}>*</span>}
            </label>
            <FieldInput
              field={field}
              value={answers[key]}
              onChange={val => setAnswers(prev => ({ ...prev, [key]: val }))}
            />
          </div>
        )
      })}
    </div>
  )
}
