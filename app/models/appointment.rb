# frozen_string_literal: true

# == Schema Information
#
# Table name: appointments
#
#  id                       :bigint           not null, primary key
#  end_time                 :datetime
#  payment_status           :integer
#  price_cents              :integer          not null
#  price_currency           :string           default("BRL")
#  start_time               :datetime
#  status                   :integer          default(0)
#  whatsapp_number          :string
#  created_at               :datetime         not null
#  updated_at               :datetime         not null
#  account_id               :bigint           not null
#  account_user_id          :bigint           not null
#  contact_id               :bigint
#  service_id               :bigint           not null
#  stripe_payment_intent_id :string
#  stripe_payment_link_id   :string
#
# Indexes
#
#  index_appointments_on_account_id              (account_id)
#  index_appointments_on_account_user_id         (account_user_id)
#  index_appointments_on_contact_id              (contact_id)
#  index_appointments_on_payment_status          (payment_status)
#  index_appointments_on_service_id              (service_id)
#  index_appointments_on_stripe_payment_link_id  (stripe_payment_link_id)
#  index_appointments_on_whatsapp_number         (whatsapp_number)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (account_user_id => account_users.id)
#  fk_rails_...  (contact_id => people.id)
#  fk_rails_...  (service_id => offers.id)
#
class Appointment < ApplicationRecord
  # Note: Discardable não está disponível pois a tabela não tem discarded_at
  # include Discardable

  acts_as_tenant :account

  # Status do agendamento
  APPOINTMENT_STATUS = {
    pending: 0,      # Pré-agendado, aguardando pagamento
    confirmed: 1,   # Confirmado após pagamento
    completed: 2,   # Serviço realizado
    canceled: 3,    # Cancelado
    no_show: 4      # Cliente não compareceu
  }.freeze

  # Status do pagamento
  PAYMENT_STATUS = {
    pending: 0,     # Aguardando pagamento
    paid: 1,        # Pago
    failed: 2,      # Falhou
    refunded: 3     # Reembolsado
  }.freeze

  as_enum :status, APPOINTMENT_STATUS, source: :status
  as_enum :payment_status, PAYMENT_STATUS, source: :payment_status

  monetize :price_cents, with_model_currency: :price_currency

  belongs_to :account_user # Profissional (cabeleireiro)
  belongs_to :service
  belongs_to :contact, optional: true # Cliente (se já existir no sistema)

  has_many :appointment_commissions, dependent: :destroy
  has_one :financial_transaction, dependent: :nullify, class_name: 'Transaction', foreign_key: 'appointment_id'

  validates :start_time, presence: true
  validates :end_time, presence: true
  validates :price_cents, presence: true, numericality: { greater_than: 0 }
  validates :whatsapp_number, presence: true
  validate :end_time_after_start_time
  validate :no_overlapping_appointments
  validate :within_professional_working_hours

  scope :pending_payment, -> { where(status: APPOINTMENT_STATUS[:pending], payment_status: PAYMENT_STATUS[:pending]) }
  scope :confirmed, -> { where(status: APPOINTMENT_STATUS[:confirmed]) }
  scope :by_professional, ->(account_user_id) { where(account_user_id: account_user_id) }
  scope :by_date_range, ->(start_date, end_date) { where(start_time: start_date..end_date) }
  scope :upcoming, -> { where('start_time > ?', Time.current) }

  before_validation :ensure_contact_from_whatsapp, on: :create, if: -> { whatsapp_number.present? && contact_id.blank? }
  before_create :calculate_end_time_if_missing
  after_update :sync_transaction_on_payment_status_change
  after_update :sync_transaction_on_status_change
  after_create :create_audit_transaction_if_unpaid

  def confirm_payment!
    update!(
      status: :confirmed,
      payment_status: :paid
    )
    create_commissions
    create_transaction
  end

  def cancel!
    update!(status: :canceled)
  end

  def professional
    account_user.user
  end

  def client_name
    contact&.name || whatsapp_number
  end

  private

  def end_time_after_start_time
    return unless start_time && end_time

    errors.add(:end_time, 'deve ser após o horário de início') if end_time <= start_time
  end

  def no_overlapping_appointments
    return unless start_time && end_time && account_user_id

    overlapping = Appointment
                  .where(account_user_id: account_user_id)
                  .where.not(id: id)
                  .where.not(status: APPOINTMENT_STATUS[:canceled])
                  .where(
                    '(start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?)',
                    end_time, start_time,
                    start_time, end_time
                  )
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
    # Buscar porcentagem de comissão configurada para o profissional
    # Por enquanto, vamos usar uma porcentagem padrão (pode ser configurável depois)
    commission_percentage = 50.0 # 50% de comissão padrão

    commission_amount_cents = (price_cents * commission_percentage / 100).round

    appointment_commissions.create!(
      account_user: account_user,
      commission_type: 0, # percentage
      commission_value: commission_percentage,
      commission_amount_cents: commission_amount_cents
    )
  end

  def create_transaction
    # Método legado - usar create_paid_transaction em vez disso
    # Mantido para compatibilidade com confirm_payment!
    create_paid_transaction
  end

  def ensure_contact_from_whatsapp
    # Criar contato automaticamente se não existir contact_id mas houver whatsapp_number
    return if contact_id.present? || whatsapp_number.blank?
    return unless account.present? # Garantir que account está disponível

    normalized_number = whatsapp_number.gsub(/\D/, '')
    return if normalized_number.blank?

    # Buscar contato existente por número de telefone
    # Primeiro tenta buscar diretamente pelo número normalizado
    contact = account.contacts.find_by(cell_phone_number: normalized_number) ||
              account.contacts.find_by(phone_number: normalized_number)

    # Se não encontrar, buscar em memória comparando números normalizados
    # (para casos onde o número pode estar formatado de forma diferente)
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

    # Criar novo contato se não existir
    if contact.nil?
      # Garantir que o nome tenha pelo menos 2 caracteres (validação do Person)
      contact_name = whatsapp_number.present? ? "Cliente #{whatsapp_number}" : "Cliente"
      # Limitar a 200 caracteres e garantir mínimo de 2
      contact_name = contact_name[0..199] if contact_name.length > 200
      contact_name = "Cliente" if contact_name.length < 2
      
      contact = account.contacts.build(
        first_name: contact_name,
        cell_phone_number: normalized_number,
        contact_type_cd: Contact::CONTACT_TYPES[:customer],
        account_id: account.id # Garantir que account_id está definido
      )
      
      unless contact.save
        error_messages = contact.errors.full_messages.join(', ')
        Rails.logger.error "Failed to create contact for appointment: #{error_messages}"
        Rails.logger.error "Contact attributes: #{contact.attributes.inspect}"
        Rails.logger.error "Contact errors: #{contact.errors.inspect}"
        Rails.logger.error "Account: #{account.inspect}"
        errors.add(:base, "Não foi possível criar o contato: #{error_messages}")
        return false # Retornar false para interromper a validação
      end
    end

    self.contact_id = contact.id
    true # Retornar true para continuar a validação
  end

  def create_contact_from_whatsapp
    # Método legado mantido para compatibilidade
    # Garante que o contato existe e retorna ele
    ensure_contact_from_whatsapp unless contact_id.present?
    contact
  end

  # Callback para criar/atualizar transação quando payment_status mudar para paid
  def sync_transaction_on_payment_status_change
    return unless payment_status_changed?
    
    # Verificar se mudou para paid (pode ser símbolo ou string)
    is_paid = payment_status == :paid || payment_status == 'paid' || payment_status == PAYMENT_STATUS[:paid]
    return unless is_paid

    # Se já existe uma transação, atualizar para paga
    if financial_transaction.present?
      professional_name = professional&.name || "#{professional&.first_name || ''} #{professional&.last_name || ''}".strip.presence || 'N/A'
      description_text = "Agendamento PAGO: #{service.name} - Profissional: #{professional_name} - Cliente: #{client_name}"
      
      financial_transaction.update!(
        paid: true,
        paid_at: Time.current,
        paid_amount_cents: price_cents,
        description: description_text
      )
    else
      # Criar nova transação de receita paga
      create_paid_transaction
    end
  end

  # Callback para criar/atualizar transação quando status mudar para canceled
  def sync_transaction_on_status_change
    return unless status_changed?
    
    # Verificar se mudou para canceled (pode ser símbolo ou string)
    is_canceled = status == :canceled || status == 'canceled' || status == APPOINTMENT_STATUS[:canceled]
    return unless is_canceled

    # Se já existe uma transação, atualizar para não paga (cancelada)
    if financial_transaction.present?
      financial_transaction.update!(
        paid: false,
        paid_at: nil,
        paid_amount_cents: 0,
        description: "Agendamento CANCELADO: #{service.name} - #{client_name}"
      )
    else
      # Criar transação de auditoria (receita não paga)
      create_audit_transaction(canceled: true)
    end
  end

  # Callback para criar transação de auditoria quando agendamento é criado mas não pago
  def create_audit_transaction_if_unpaid
    return if payment_status == :paid
    return if financial_transaction.present? # Evitar duplicação

    # Criar transação de auditoria (receita não paga) para rastrear valores pedidos
    create_audit_transaction(canceled: false)
  end

  def create_paid_transaction
    bank_account = account.default_bank_account || account.bank_accounts.first
    return unless bank_account

    contact_record = contact || create_contact_from_whatsapp

    professional_name = professional&.name || "#{professional&.first_name || ''} #{professional&.last_name || ''}".strip.presence || 'N/A'
    description_text = "Agendamento PAGO: #{service.name} - Profissional: #{professional_name} - Cliente: #{client_name}"

    transaction_record = Transaction.create!(
      account: account,
      bank_account: bank_account,
      contact: contact_record,
      service: service,
      appointment: self,
      transaction_type_cd: Transaction::TRANSACTION_TYPES[:revenue],
      amount_cents: price_cents,
      amount_currency: price_currency,
      due_date: start_time.to_date,
      payment_method_cd: Transaction::PAYMENT_METHOD[:pix], # Assumindo PIX como padrão para agendamentos
      payment_type_cd: Transaction::PAYMENT_TYPE[:on_cash],
      paid: true,
      paid_at: Time.current,
      paid_amount_cents: price_cents,
      description: description_text,
      name: "Agendamento #{service.name}"
    )

    transaction_record
  end

  def create_audit_transaction(canceled: false)
    bank_account = account.default_bank_account || account.bank_accounts.first
    return unless bank_account

    contact_record = contact || create_contact_from_whatsapp

    status_text = canceled ? 'CANCELADO' : 'NÃO PAGO'
    description_text = canceled ? 
      "Agendamento CANCELADO: #{service.name} - #{client_name}" :
      "Agendamento NÃO PAGO (Auditoria): #{service.name} - #{client_name}"

    transaction_record = Transaction.create!(
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
      name: "Agendamento #{status_text} - #{service.name}"
    )

    transaction_record
  end
end

