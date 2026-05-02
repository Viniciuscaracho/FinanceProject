/**
 * Utilitários para normalização e formatação de dados de appointments
 */

// Mapeamento de status numérico para string
export const APPOINTMENT_STATUS_MAP = {
  0: 'pending',
  1: 'confirmed',
  2: 'completed',
  3: 'canceled',
  4: 'no_show',
}

const VALID_STRING_STATUSES = new Set(['pending', 'confirmed', 'completed', 'canceled', 'no_show'])

/**
 * Função única de resolução de status — aceita número OU string, sempre devolve string canônica.
 * Use esta no lugar de normalizeStatus em código novo.
 */
export function resolveStatus(raw) {
  if (typeof raw === 'number') return APPOINTMENT_STATUS_MAP[raw] ?? 'pending'
  if (typeof raw === 'string' && VALID_STRING_STATUSES.has(raw)) return raw
  return 'pending'
}

/**
 * Extrai o nome/identificador legível do cliente, normalizando contact vs client.
 */
export function getClientName(apt) {
  return (
    apt?.client?.name ||
    apt?.contact?.name ||
    apt?.client?.whatsapp_number ||
    apt?.whatsapp_number ||
    null
  )
}

export const PAYMENT_STATUS_MAP = {
  0: 'pending',
  1: 'paid',
  2: 'failed',
  3: 'refunded'
}

// Labels para status
export const STATUS_LABELS = {
  pending: 'Aguardando Pagamento',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  canceled: 'Cancelado',
  no_show: 'Não Compareceu'
}

export const PAYMENT_STATUS_LABELS = {
  pending: 'Pendente',
  paid: 'Pago',
  failed: 'Falhou',
  refunded: 'Reembolsado'
}

// Ordered option arrays — use these instead of Object.entries(STATUS_LABELS)
export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Aguardando Pagamento' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'completed', label: 'Concluído' },
  { value: 'canceled', label: 'Cancelado' },
  { value: 'no_show', label: 'Não Compareceu' },
]

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'paid', label: 'Pago' },
  { value: 'failed', label: 'Falhou' },
  { value: 'refunded', label: 'Reembolsado' },
]

// Cores para status
export const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  canceled: 'bg-red-100 text-red-800',
  no_show: 'bg-gray-100 text-gray-800'
}

export const PAYMENT_STATUS_COLORS = {
  pending: 'bg-orange-100 text-orange-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800'
}

/** @deprecated use resolveStatus */
export function normalizeStatus(status) {
  return resolveStatus(status)
}

/**
 * Normaliza o payment_status de um appointment (número para string)
 */
export function normalizePaymentStatus(paymentStatus) {
  if (typeof paymentStatus === 'number') {
    return PAYMENT_STATUS_MAP[paymentStatus] || 'pending'
  }
  if (typeof paymentStatus === 'string') {
    return paymentStatus
  }
  return 'pending'
}

/**
 * Normaliza um appointment completo.
 * - status/payment_status → sempre string canônica
 * - client → unifica contact vs client, expõe whatsapp_number no nível esperado
 */
export function normalizeAppointment(appointment) {
  if (!appointment) return null

  const rawClient = appointment.client || appointment.contact || null
  const client = rawClient
    ? {
        ...rawClient,
        name: rawClient.name ?? null,
        whatsapp_number:
          rawClient.whatsapp_number ?? appointment.whatsapp_number ?? null,
      }
    : null

  return {
    ...appointment,
    status: resolveStatus(appointment.status),
    payment_status: normalizePaymentStatus(appointment.payment_status),
    client,
  }
}

/**
 * Normaliza uma lista de appointments
 */
export function normalizeAppointments(appointments) {
  if (!Array.isArray(appointments)) {
    return []
  }
  return appointments.map(normalizeAppointment)
}

/**
 * Formata número de WhatsApp (adiciona máscara)
 */
export function formatWhatsAppNumber(value) {
  if (!value) return ''
  
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '')
  
  // Limita a 11 dígitos (formato brasileiro)
  const limited = numbers.slice(0, 11)
  
  // Aplica máscara: (XX) XXXXX-XXXX
  if (limited.length <= 2) {
    return limited
  } else if (limited.length <= 7) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`
  } else {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`
  }
}

/**
 * Remove formatação do número de WhatsApp
 */
export function unformatWhatsAppNumber(value) {
  if (!value) return ''
  return value.replace(/\D/g, '')
}

/**
 * Valida número de WhatsApp
 */
export function isValidWhatsAppNumber(value) {
  const numbers = unformatWhatsAppNumber(value)
  // Deve ter 10 ou 11 dígitos (com ou sem DDD)
  return numbers.length >= 10 && numbers.length <= 11
}

/**
 * Valida se data de fim é depois da data de início
 */
export function validateDateTimeRange(startDate, startTime, endDate, endTime) {
  if (!startDate || !startTime || !endDate || !endTime) {
    return { valid: false, error: 'Todas as datas e horários são obrigatórios' }
  }

  const start = new Date(startDate)
  const [startHours, startMinutes] = startTime.split(':').map(Number)
  start.setHours(startHours, startMinutes, 0, 0)

  const end = new Date(endDate)
  const [endHours, endMinutes] = endTime.split(':').map(Number)
  end.setHours(endHours, endMinutes, 0, 0)

  if (end <= start) {
    return { valid: false, error: 'A data/hora de fim deve ser posterior à data/hora de início' }
  }

  return { valid: true }
}

/**
 * Calcula end_time baseado em start_time e duração do serviço
 */
export function calculateEndTime(startDate, startTime, serviceDurationMinutes = 60) {
  if (!startDate || !startTime) return null

  const start = new Date(startDate)
  const [hours, minutes] = startTime.split(':').map(Number)
  start.setHours(hours, minutes, 0, 0)

  const end = new Date(start)
  end.setMinutes(end.getMinutes() + serviceDurationMinutes)

  return {
    endDate: end,
    endTime: `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`
  }
}


