# frozen_string_literal: true

# == Schema Information
#
# Table name: appointments
#
#  id                           :bigint           not null, primary key
#  additional_service_ids       :jsonb            not null
#  billing_notification_sent    :boolean          default(FALSE), not null
#  billing_notification_sent_at :datetime
#  end_time                     :datetime
#  google_meet_link             :string
#  is_demo                      :boolean          default(FALSE), not null
#  manage_token                 :string
#  overdue_notification_sent    :boolean          default(FALSE), not null
#  overdue_notification_sent_at :datetime
#  payment_status               :integer
#  pix_reminder_sent            :boolean          default(FALSE), not null
#  pix_reminder_sent_at         :datetime
#  price_cents                  :integer          not null
#  price_currency               :string           default("BRL")
#  recurrence_pattern           :jsonb
#  start_time                   :datetime
#  status                       :integer          default(0)
#  stripe_payment_link_url      :string
#  whatsapp_1h_reminder_sent    :boolean          default(FALSE), not null
#  whatsapp_1h_reminder_sent_at :datetime
#  whatsapp_number              :string
#  whatsapp_reminder_sent       :boolean          default(FALSE)
#  whatsapp_reminder_sent_at    :datetime
#  created_at                   :datetime         not null
#  updated_at                   :datetime         not null
#  account_id                   :bigint           not null
#  account_user_id              :bigint           not null
#  anamnese_template_id         :bigint
#  appointment_link_id          :bigint
#  contact_id                   :bigint
#  google_calendar_event_id     :string
#  parent_appointment_id        :bigint
#  service_id                   :bigint           not null
#  stripe_payment_intent_id     :string
#  stripe_payment_link_id       :string
#
# Indexes
#
#  index_appointments_on_account_id                        (account_id)
#  index_appointments_on_account_professional_status_time  (account_id,account_user_id,status,start_time)
#  index_appointments_on_account_time_status               (account_id,start_time,status)
#  index_appointments_on_account_user_id                   (account_user_id)
#  index_appointments_on_anamnese_template_id              (anamnese_template_id)
#  index_appointments_on_appointment_link_id               (appointment_link_id)
#  index_appointments_on_billing_notification_sent         (billing_notification_sent)
#  index_appointments_on_contact_id                        (contact_id)
#  index_appointments_on_google_calendar_event_id          (google_calendar_event_id)
#  index_appointments_on_manage_token                      (manage_token) UNIQUE
#  index_appointments_on_overdue_notification_sent         (overdue_notification_sent)
#  index_appointments_on_parent_appointment_id             (parent_appointment_id)
#  index_appointments_on_payment_status                    (payment_status)
#  index_appointments_on_service_id                        (service_id)
#  index_appointments_on_stripe_payment_link_id            (stripe_payment_link_id)
#  index_appointments_on_whatsapp_number                   (whatsapp_number)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (account_user_id => account_users.id)
#  fk_rails_...  (anamnese_template_id => anamnese_templates.id)
#  fk_rails_...  (appointment_link_id => appointment_links.id) ON DELETE => nullify
#  fk_rails_...  (contact_id => people.id)
#  fk_rails_...  (parent_appointment_id => appointments.id) ON DELETE => nullify
#  fk_rails_...  (service_id => offers.id)
#
class Appointment < ApplicationRecord
  include Attachable

  acts_as_tenant :account

  APPOINTMENT_STATUS = {
    pending: 0,
    confirmed: 1,
    completed: 2,
    canceled: 3,
    no_show: 4
  }.freeze

  PAYMENT_STATUS = {
    pending: 0,
    paid: 1,
    failed: 2,
    refunded: 3
  }.freeze

  as_enum :status, APPOINTMENT_STATUS, source: :status
  as_enum :payment_status, PAYMENT_STATUS, source: :payment_status

  monetize :price_cents, with_model_currency: :price_currency

  belongs_to :account_user
  belongs_to :service
  belongs_to :contact, optional: true
  belongs_to :parent_appointment, optional: true, class_name: 'Appointment', foreign_key: 'parent_appointment_id'
  belongs_to :appointment_link, optional: true
  belongs_to :anamnese_template, optional: true

  has_many :appointment_commissions, dependent: :destroy
  has_many :recurring_appointments, class_name: 'Appointment', foreign_key: 'parent_appointment_id', dependent: :nullify
  has_one :financial_transaction, dependent: :nullify, class_name: 'Transaction', foreign_key: 'appointment_id'
  has_one :appointment_note,     dependent: :destroy
  has_one :anamnese_response,    dependent: :destroy

  validates :start_time, presence: true
  validates :end_time, presence: true
  validates :price_cents, presence: true, numericality: { greater_than: 0 }
  validates :whatsapp_number, presence: true
  validate :end_time_after_start_time
  validate :no_overlapping_appointments
  validate :within_professional_working_hours
  validate :valid_status_transition, on: :update

  scope :pending_payment, -> { where(status: APPOINTMENT_STATUS[:pending], payment_status: PAYMENT_STATUS[:pending]) }
  scope :confirmed, -> { where(status: APPOINTMENT_STATUS[:confirmed]) }
  scope :by_professional, ->(account_user_id) { where(account_user_id: account_user_id) }
  scope :by_date_range, ->(start_date, end_date) { where(start_time: start_date..end_date) }
  scope :upcoming, -> { where('start_time > ?', Time.current) }
  scope :needs_reminder, -> { where(whatsapp_reminder_sent: false).where('start_time > ? AND start_time <= ?', Time.current, 24.hours.from_now) }
  scope :needs_1h_reminder, -> { where(whatsapp_1h_reminder_sent: false).where('start_time > ? AND start_time <= ?', 1.hour.from_now, 2.hours.from_now) }
  scope :needs_billing_notification, -> { where(billing_notification_sent: false, payment_status: PAYMENT_STATUS[:pending]) }
  scope :needs_pix_reminder, -> { where(pix_reminder_sent: false, payment_status: PAYMENT_STATUS[:pending]).where('start_time > ? AND start_time <= ?', 24.hours.from_now, 25.hours.from_now) }
  scope :needs_overdue_notification, -> { where(overdue_notification_sent: false, payment_status: PAYMENT_STATUS[:pending]).where('start_time < ? AND start_time >= ?', Time.current, 48.hours.ago) }
  scope :recurring, -> { where.not(recurrence_pattern: nil).where.not(recurrence_pattern: {}) }
  scope :parent_appointments, -> { where(parent_appointment_id: nil) }

  before_validation :ensure_contact_from_whatsapp, on: :create, if: -> { whatsapp_number.present? && contact_id.blank? }
  before_create :calculate_end_time_if_missing
  before_create :generate_manage_token
  after_update :sync_transaction_on_payment_status_change
  after_update :sync_transaction_on_status_change
  after_update :send_whatsapp_on_confirmation
  after_update :send_payment_confirmation_whatsapp
  after_create :create_audit_transaction_if_unpaid
  after_create :schedule_appointment_confirmations
  after_update :schedule_google_calendar_sync_on_change
  after_commit :dispatch_whatsapp_confirmation_event, on: :create
  after_commit :dispatch_whatsapp_confirmation_event_on_update, on: :update
  after_commit :dispatch_whatsapp_payment_confirmed_event, on: :update

  # ── Client self-service ───────────────────────────────────────────────────

  def can_be_managed?
    return false unless manage_token.present?
    return false unless appointment_link.present?
    return false unless status.in?([:pending, :confirmed])
    return false if start_time.blank?

    hours = (appointment_link.settings&.dig('cancel_reschedule_hours')&.to_i || 24).clamp(1, 720)
    Time.current < start_time - hours.hours
  end

  def manage_url
    return nil unless manage_token.present?
    "#{ENV.fetch('FRONTEND_URL', 'http://localhost:5173')}/agendar/gerenciar/#{manage_token}"
  end

  def anamnese_link
    return nil unless manage_token.present?
    "#{ENV.fetch('FRONTEND_URL', 'http://localhost:5173')}/anamnese/responder/#{manage_token}"
  end

  def manage_window_deadline
    return nil unless appointment_link.present? && start_time.present?
    hours = (appointment_link.settings&.dig('cancel_reschedule_hours')&.to_i || 24).clamp(1, 720)
    start_time - hours.hours
  end

  def confirm_payment!
    update!(status: :confirmed, payment_status: :paid)
    create_commissions
    create_paid_transaction
  end

  def cancel!
    was_paid = payment_status == :paid || payment_status == PAYMENT_STATUS[:paid]
    
    if was_paid
      update!(
        status: :canceled,
        payment_status: :refunded
      )
      # Cancelar comissões se existirem
      appointment_commissions.destroy_all
      
      # Processar reembolso via Stripe se aplicável
      if stripe_payment_intent_id.present?
        begin
          refund_result = Appointments::ProcessRefund.call(appointment: self)
          unless refund_result.success?
            Rails.logger.warn "Não foi possível processar reembolso para agendamento #{id}: #{refund_result.message}"
            # Não falhar o cancelamento se o reembolso falhar - apenas logar
          end
        rescue => e
          Rails.logger.error "Erro ao processar reembolso para agendamento #{id}: #{e.message}"
          # Não falhar o cancelamento se o reembolso falhar - apenas logar
        end
      end
    else
      update!(status: :canceled)
    end
  end

  def professional
    account_user.user
  end

  def client_name
    contact&.name || whatsapp_number
  end

  # Buscar tarefas pendentes da sessão anterior do mesmo paciente
  def previous_session_pending_tasks
    return [] unless contact_id.present?

    # Buscar a última sessão completada do mesmo paciente com o mesmo profissional
    previous_appointment = account.appointments
      .where(contact_id: contact_id)
      .where(account_user_id: account_user_id)
      .where(status: APPOINTMENT_STATUS[:completed])
      .where('start_time < ?', start_time)
      .order(start_time: :desc)
      .first

    return [] unless previous_appointment&.appointment_note

    previous_appointment.appointment_note.pending_tasks
  end

  # Buscar todas as tarefas pendentes do paciente (de todas as sessões anteriores)
  def all_pending_tasks_for_patient
    return [] unless contact_id.present?

    # Buscar todas as sessões completadas do mesmo paciente com o mesmo profissional
    previous_appointments = account.appointments
      .where(contact_id: contact_id)
      .where(account_user_id: account_user_id)
      .where(status: APPOINTMENT_STATUS[:completed])
      .where('start_time < ?', start_time)
      .order(start_time: :desc)
      .includes(:appointment_note)

    all_tasks = []
    previous_appointments.each do |appt|
      next unless appt.appointment_note
      pending = appt.appointment_note.pending_tasks
      pending.each do |task|
        task['from_session_date'] = appt.start_time.to_date.iso8601
        task['from_session_id'] = appt.id
      end
      all_tasks.concat(pending)
    end

    all_tasks
  end

  def recurring?
    recurrence_pattern.present? && recurrence_pattern.is_a?(Hash) && recurrence_pattern['frequency'].present?
  end

  def has_google_meet?
    google_meet_link.present?
  end

  def generate_google_meet_link
    return google_meet_link if google_meet_link.present?

    result = Appointments::GenerateGoogleMeetLink.call(appointment: self)
    result.google_meet_link
  rescue => e
    Rails.logger.error "Erro ao gerar link do Google Meet via modelo: #{e.message}"
    nil
  end

  def cancel_recurring_series!
    return unless recurring? && parent_appointment_id.nil?

    # Cancelar todos os agendamentos futuros da série
    recurring_appointments.where('start_time > ?', Time.current).update_all(status: APPOINTMENT_STATUS[:canceled])
    cancel!
  end

  def valid_status_transition
    return unless status_changed?
    
    # Estados finais não podem ser alterados (exceto para cancelado em casos específicos)
    if status_was == :completed && status != :canceled
      errors.add(:status, 'Não é possível alterar o status de um agendamento concluído')
      return
    end
    
    if status_was == :canceled && status != :canceled
      errors.add(:status, 'Não é possível alterar o status de um agendamento cancelado')
      return
    end
    
    # Validações de transição específicas
    case status
    when :completed
      unless status_was == :confirmed
        errors.add(:status, 'Apenas agendamentos confirmados podem ser concluídos')
      end
    when :confirmed
      unless status_was == :pending
        errors.add(:status, 'Apenas agendamentos pendentes podem ser confirmados')
      end
    when :no_show
      unless status_was == :confirmed
        errors.add(:status, 'Apenas agendamentos confirmados podem ser marcados como não compareceu')
      end
    when :pending
      errors.add(:status, 'Não é possível retornar um agendamento ao status pendente')
    end
  end

  private

  def end_time_after_start_time
    return unless start_time && end_time

    errors.add(:end_time, 'deve ser após o horário de início') if end_time <= start_time
  end

  # Pending appointments older than this window are treated as abandoned (payment never completed).
  PENDING_PAYMENT_WINDOW = 30.minutes

  def no_overlapping_appointments
    return unless start_time && end_time && account_user_id && account_id

    overlapping = Appointment
                  .where(account_id: account_id)
                  .where(account_user_id: account_user_id)
                  .where.not(id: id)
                  .where.not(status: [APPOINTMENT_STATUS[:canceled], APPOINTMENT_STATUS[:no_show]])
                  .where(
                    'NOT (status = ? AND created_at < ?)',
                    APPOINTMENT_STATUS[:pending], PENDING_PAYMENT_WINDOW.ago
                  )
                  .where('start_time < ? AND end_time > ?', end_time, start_time)
                  .exists?

    errors.add(:base, 'Já existe um agendamento neste horário para este profissional') if overlapping
  end

  def within_professional_working_hours
    return unless start_time && end_time && account_user_id

    professional = account_user
    return unless professional

    # Verificar se o horário de início está dentro do horário de trabalho
    unless professional.available_at?(start_time)
      day_name = start_time.strftime('%A')
      hours = professional.working_hours_for_day(day_name)
      
      if !hours[:enabled]
        day_name_pt = {
          'Monday' => 'segundas-feiras',
          'Tuesday' => 'terças-feiras',
          'Wednesday' => 'quartas-feiras',
          'Thursday' => 'quintas-feiras',
          'Friday' => 'sextas-feiras',
          'Saturday' => 'sábados',
          'Sunday' => 'domingos'
        }[day_name] || day_name.downcase
        errors.add(:start_time, "O profissional não trabalha às #{day_name_pt}")
      else
        errors.add(:start_time, "O horário de início deve estar entre #{hours[:start_hour]}h e #{hours[:end_hour]}h")
      end
      return
    end

    # Verificar se o horário de fim está dentro do horário de trabalho
    # Verificar o último minuto do agendamento
    end_check_time = end_time - 1.minute
    unless professional.available_at?(end_check_time)
      day_name = end_time.strftime('%A')
      hours = professional.working_hours_for_day(day_name)
      
      if !hours[:enabled]
        day_name_pt = {
          'Monday' => 'segundas-feiras',
          'Tuesday' => 'terças-feiras',
          'Wednesday' => 'quartas-feiras',
          'Thursday' => 'quintas-feiras',
          'Friday' => 'sextas-feiras',
          'Saturday' => 'sábados',
          'Sunday' => 'domingos'
        }[day_name] || day_name.downcase
        errors.add(:end_time, "O profissional não trabalha às #{day_name_pt}")
      else
        errors.add(:end_time, "O horário de término deve estar entre #{hours[:start_hour]}h e #{hours[:end_hour]}h")
      end
    end
  end

  def calculate_end_time_if_missing
    return if end_time.present?

    # Assume duração padrão de 1 hora se não especificado
    self.end_time = start_time + 1.hour
  end

  def create_commissions
    return if appointment_commissions.exists?

    # Verificar override específico por serviço primeiro
    service_config = service_id.present? ? account_user.professional_commissions.find_by(service_id: service_id) : nil

    if service_config
      commission_amount_cents = service_config.amount_cents_for(price_cents)
      appointment_commissions.create!(
        account_user: account_user,
        commission_type: service_config[:commission_type],
        commission_value: service_config.commission_value,
        commission_amount_cents: commission_amount_cents
      )
    else
      # Usar porcentagem padrão configurada no profissional (default: 50%)
      commission_percentage = account_user.commission_percentage || 50.0
      commission_amount_cents = (price_cents * commission_percentage / 100).round
      appointment_commissions.create!(
        account_user: account_user,
        commission_type: 0, # percentage
        commission_value: commission_percentage,
        commission_amount_cents: commission_amount_cents
      )
    end
  end

  def create_transaction
    # Método legado - usar create_paid_transaction em vez disso
    # Mantido para compatibilidade com confirm_payment!
    create_paid_transaction
  end

  def ensure_contact_from_whatsapp
    return if contact_id.present? || whatsapp_number.blank?
    return unless account.present?

    normalized_number = whatsapp_number.gsub(/\D/, '')
    return if normalized_number.blank?

    contact = account.contacts.find_by(cell_phone_number: normalized_number) ||
              account.contacts.find_by(phone_number: normalized_number)

    if contact.nil?
      account.contacts.find_each do |c|
        cell_normalized = (c.cell_phone_number || '').gsub(/\D/, '')
        phone_normalized = (c.phone_number || '').gsub(/\D/, '')
        if cell_normalized == normalized_number || phone_normalized == normalized_number
          contact = c
          break
        end
      end
    end

    if contact.nil?
      contact_name = "Cliente #{whatsapp_number}"
      contact_name = contact_name[0..199] if contact_name.length > 200
      contact_name = "Cliente" if contact_name.length < 2

      contact = account.contacts.build(
        first_name: contact_name,
        cell_phone_number: normalized_number,
        contact_type_cd: Contact::CONTACT_TYPES[:customer],
        account_id: account.id
      )

      unless contact.save
        errors.add(:base, "Não foi possível criar o contato: #{contact.errors.full_messages.join(', ')}")
        return false
      end
    end

    self.contact_id = contact.id
    true
  end

  def create_contact_from_whatsapp
    ensure_contact_from_whatsapp unless contact_id.present?
    contact
  end

  def sync_transaction_on_payment_status_change
    return unless payment_status_changed?

    is_paid = payment_status == :paid || payment_status == 'paid' || payment_status == PAYMENT_STATUS[:paid]
    return unless is_paid

    if financial_transaction.present?
      professional_name = professional&.name || "#{professional&.first_name || ''} #{professional&.last_name || ''}".strip.presence || 'N/A'
      financial_transaction.update!(
        paid: true,
        paid_at: Time.current,
        paid_amount_cents: price_cents,
        description: "Agendamento PAGO: #{service.name} - Profissional: #{professional_name} - Cliente: #{client_name}"
      )
    else
      create_paid_transaction
    end
  end

  def sync_transaction_on_status_change
    return unless status_changed?

    is_canceled = status == :canceled || status == 'canceled' || status == APPOINTMENT_STATUS[:canceled]
    return unless is_canceled

    if financial_transaction.present?
      financial_transaction.update!(
        paid: false,
        paid_at: nil,
        paid_amount_cents: 0,
        description: "Agendamento CANCELADO: #{service.name} - #{client_name}"
      )
    else
      create_audit_transaction(canceled: true)
    end
  end

  def create_audit_transaction_if_unpaid
    return if payment_status == :paid
    return if financial_transaction.present?

    create_audit_transaction(canceled: false)
  end

  def create_paid_transaction
    bank_account = account.default_bank_account || account.bank_accounts.first
    
    unless bank_account
      errors.add(:base, 'É necessário ter pelo menos uma conta bancária cadastrada para criar transações')
      raise ActiveRecord::RecordInvalid.new(self)
    end

    contact_record = contact || create_contact_from_whatsapp

    professional_name = professional&.name || "#{professional&.first_name || ''} #{professional&.last_name || ''}".strip.presence || 'N/A'
    description_text = "Agendamento PAGO: #{service.name} - Profissional: #{professional_name} - Cliente: #{client_name}"

    Transaction.create!(
      account: account,
      bank_account: bank_account,
      contact: contact_record,
      service: service,
      appointment: self,
      transaction_type_cd: Transaction::TRANSACTION_TYPES[:revenue],
      amount_cents: price_cents,
      amount_currency: price_currency,
      due_date: start_time.to_date,
      payment_method_cd: Transaction::PAYMENT_METHOD[:pix],
      payment_type_cd: Transaction::PAYMENT_TYPE[:on_cash],
      paid: true,
      paid_at: Time.current,
      paid_amount_cents: price_cents,
      description: description_text,
      name: "Agendamento #{service.name}"
    )
  end

  def schedule_appointment_confirmations
    SendAppointmentConfirmationsJob.perform_later(id)
  rescue => e
    Rails.logger.error "Falha ao agendar SendAppointmentConfirmationsJob para appointment #{id}: #{e.message}"
  end

  def schedule_google_calendar_sync
    GoogleCalendarSyncJob.perform_later(id)
  rescue => e
    Rails.logger.error "Falha ao agendar GoogleCalendarSyncJob para appointment #{id}: #{e.message}"
  end

  def schedule_google_calendar_sync_on_change
    relevant_change = saved_change_to_start_time? ||
                      saved_change_to_end_time?    ||
                      saved_change_to_status?      ||
                      saved_change_to_service_id?  ||
                      saved_change_to_contact_id?

    schedule_google_calendar_sync if relevant_change
  rescue => e
    Rails.logger.error "Falha ao agendar GoogleCalendarSyncJob (update) para appointment #{id}: #{e.message}"
  end

  def create_audit_transaction(canceled: false)
    bank_account = account.default_bank_account || account.bank_accounts.first
    return unless bank_account

    contact_record = contact || create_contact_from_whatsapp
    description_text = canceled ?
      "Agendamento CANCELADO: #{service.name} - #{client_name}" :
      "Agendamento NÃO PAGO (Auditoria): #{service.name} - #{client_name}"

    Transaction.create!(
      account: account,
      bank_account: bank_account,
      contact: contact_record,
      service: service,
      appointment: self,
      transaction_type_cd: Transaction::TRANSACTION_TYPES[:revenue],
      amount_cents: price_cents,
      amount_currency: price_currency,
      due_date: start_time.to_date,
      payment_method_cd: Transaction::PAYMENT_METHOD[:no_payment_method],
      payment_type_cd: Transaction::PAYMENT_TYPE[:on_cash],
      paid: false,
      paid_at: nil,
      paid_amount_cents: 0,
      description: description_text,
      name: "Agendamento #{canceled ? 'CANCELADO' : 'NÃO PAGO'} - #{service.name}"
    )
  end

  def send_whatsapp_on_confirmation
    return unless status_changed? && status == :confirmed
    return unless whatsapp_number.present?

    Appointments::SendWhatsappConfirmation.call(appointment: self)
  rescue => e
    Rails.logger.error "Erro ao enviar confirmação WhatsApp: #{e.message}"
  end

  def send_payment_confirmation_whatsapp
    return unless payment_status_changed? && (payment_status == :paid || payment_status == PAYMENT_STATUS[:paid])
    return unless whatsapp_number.present?
    return unless automation_enabled?(:payment_confirmation)

    Appointments::SendPaymentConfirmation.call(appointment: self)
  rescue => e
    Rails.logger.error "Erro ao enviar confirmação de pagamento WhatsApp: #{e.message}"
  end

  def automation_enabled?(key)
    return false unless appointment_link
    settings = appointment_link.settings || {}
    (settings.dig('automations', key.to_s)) == true
  end

  def send_whatsapp_booking_receipt
    return unless appointment_link_id.present?
    return unless whatsapp_number.present?

    Appointments::SendWhatsappBookingReceipt.call(appointment: self)
  rescue => e
    Rails.logger.error "Erro ao enviar WhatsApp de confirmação de agendamento: #{e.message}"
  end

  def generate_manage_token
    self.manage_token = loop do
      token = SecureRandom.urlsafe_base64(32)
      break token unless Appointment.exists?(manage_token: token)
    end
  end

  def dispatch_whatsapp_confirmation_event
    return unless contact.present?
    WhatsApp::EventHandler.call(
      account:  account,
      contact:  contact,
      event:    :appointment_confirmation,
      resource: self
    )
  rescue => e
    Rails.logger.error "[WhatsApp::EventHandler] appointment_confirmation create: #{e.message}"
  end

  def dispatch_whatsapp_confirmation_event_on_update
    return unless contact.present?
    return unless previous_changes.key?(:status)
    return unless previous_changes[:status]&.last == APPOINTMENT_STATUS[:confirmed]
    WhatsApp::EventHandler.call(
      account:  account,
      contact:  contact,
      event:    :appointment_confirmation,
      resource: self
    )
  rescue => e
    Rails.logger.error "[WhatsApp::EventHandler] appointment_confirmation update: #{e.message}"
  end

  def dispatch_whatsapp_payment_confirmed_event
    return unless contact.present?
    return unless previous_changes.key?(:payment_status)
    return unless previous_changes[:payment_status]&.last == PAYMENT_STATUS[:paid]
    WhatsApp::EventHandler.call(
      account:  account,
      contact:  contact,
      event:    :payment_confirmed,
      resource: self
    )
  rescue => e
    Rails.logger.error "[WhatsApp::EventHandler] payment_confirmed: #{e.message}"
  end
end

