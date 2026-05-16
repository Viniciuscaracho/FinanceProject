import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import { apiService } from '@/lib/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function PublicPatientDocument() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiService.getPublicPatientDocument(token)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FB' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #E5E7EB', borderTopColor: '#10B981', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#6B7280', fontSize: 14 }}>Carregando documento...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FB' }}>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Documento não disponível</p>
          <p style={{ color: '#6B7280', fontSize: 14 }}>{error}</p>
        </div>
      </div>
    )
  }

  const { document: doc, professional, patient } = data

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FB', padding: '24px 16px' }}>
      {/* Barra do profissional */}
      <div style={{ maxWidth: 860, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Documento de</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>{professional.name}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Paciente</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>{patient.name}</p>
        </div>
      </div>

      {/* Documento */}
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div
          style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '40px 48px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(doc.content || '') }}
        />
      </div>

      {/* Rodapé */}
      <div style={{ maxWidth: 860, margin: '16px auto 0', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#9CA3AF' }}>
          Atualizado em {format(new Date(doc.updated_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>
    </div>
  )
}
