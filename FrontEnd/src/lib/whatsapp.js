import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

export function openWhatsApp(phone, message) {
  const digits = phone?.replace(/\D/g, '')
  if (!digits) return
  // Brazilian numbers without country code get 55 prepended
  const number = digits.startsWith('55') ? digits : `55${digits}`
  const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

function fmtDate(iso) {
  try {
    return format(parseISO(iso), "dd/MM 'às' HH:mm", { locale: ptBR })
  } catch {
    return iso || ''
  }
}

function fmtCurrency(cents) {
  const val = (Number(cents) || 0) / 100
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export const WA_TEMPLATES = {
  confirmation: (apt) => {
    const name = apt.client?.name || apt.contact?.name || 'cliente'
    const service = apt.service?.name || 'serviço'
    const date = fmtDate(apt.start_time)
    return `Olá ${name}! Confirmo seu agendamento de *${service}* para ${date}. Qualquer dúvida é só chamar! 😊`
  },

  reminder: (apt) => {
    const name = apt.client?.name || apt.contact?.name || 'cliente'
    const service = apt.service?.name || 'serviço'
    const date = fmtDate(apt.start_time)
    return `Olá ${name}! Lembrando do seu agendamento de *${service}* amanhã ${date}. Te esperamos! 👋`
  },

  payment: (transaction) => {
    const name = transaction.contact?.name || 'cliente'
    const desc = transaction.name || transaction.description || 'serviço'
    const value = fmtCurrency(transaction.amount_cents)
    return `Olá ${name}! Passando para lembrar do pagamento de *${desc}* no valor de *${value}*. Qualquer dúvida, é só chamar! 🙏`
  },
}

export function getAppointmentPhone(apt) {
  return apt?.whatsapp_number || apt?.client?.whatsapp_number || apt?.contact?.cell_phone_number || ''
}

export function getContactPhone(contact) {
  return contact?.cell_phone_number || contact?.phone_number || contact?.phone || ''
}
