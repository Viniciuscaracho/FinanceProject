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
require 'test_helper'

class AppointmentTest < ActiveSupport::TestCase
  setup do
    # Freeze to Tuesday at 10am so that +1.day = Wednesday (weekday, within 9-18h default schedule)
    travel_to Time.zone.parse('2025-01-07 10:00:00')
    _, @account = register_user
    @bank_account = create_bank_account(@account)
    @account_user = @account.account_users.first
    @service = create_service(@account)
    @contact = create_contact(@account)
  end

  teardown { travel_back }

  test "should not allow overlapping appointments for same professional" do
    # Criar primeiro agendamento
    appointment1 = @account.appointments.create!(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: Time.current + 1.day,
      end_time: Time.current + 1.day + 1.hour,
      price_cents: 10000,
      whatsapp_number: "5511999999999"
    )

    # Tentar criar agendamento sobreposto
    appointment2 = @account.appointments.new(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: Time.current + 1.day + 30.minutes,
      end_time: Time.current + 1.day + 1.hour + 30.minutes,
      price_cents: 10000,
      whatsapp_number: "5511999999999"
    )

    assert_not appointment2.valid?
    assert_includes appointment2.errors[:base], 'Já existe um agendamento neste horário para este profissional'
  end

  test "should allow overlapping appointments if first is canceled" do
    appointment1 = @account.appointments.create!(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: Time.current + 1.day,
      end_time: Time.current + 1.day + 1.hour,
      price_cents: 10000,
      whatsapp_number: "5511999999999",
      status: :canceled
    )

    appointment2 = @account.appointments.new(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: Time.current + 1.day + 30.minutes,
      end_time: Time.current + 1.day + 1.hour + 30.minutes,
      price_cents: 10000,
      whatsapp_number: "5511999999999"
    )

    assert appointment2.valid?
  end

  test "should allow overlapping appointments if first is no_show" do
    appointment1 = @account.appointments.create!(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: Time.current + 1.day,
      end_time: Time.current + 1.day + 1.hour,
      price_cents: 10000,
      whatsapp_number: "5511999999999",
      status: :no_show
    )

    appointment2 = @account.appointments.new(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: Time.current + 1.day + 30.minutes,
      end_time: Time.current + 1.day + 1.hour + 30.minutes,
      price_cents: 10000,
      whatsapp_number: "5511999999999"
    )

    assert appointment2.valid?
  end

  test "should not allow status transition from completed to pending" do
    appointment = @account.appointments.create!(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: Time.current + 1.day,
      end_time: Time.current + 1.day + 1.hour,
      price_cents: 10000,
      whatsapp_number: "5511999999999",
      status: :completed
    )

    appointment.status = :pending
    assert_not appointment.valid?
    assert_includes appointment.errors[:status], 'Não é possível alterar o status de um agendamento concluído'
  end

  test "should not allow status transition from canceled to pending" do
    appointment = @account.appointments.create!(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: Time.current + 1.day,
      end_time: Time.current + 1.day + 1.hour,
      price_cents: 10000,
      whatsapp_number: "5511999999999",
      status: :canceled
    )

    appointment.status = :pending
    assert_not appointment.valid?
    assert_includes appointment.errors[:status], 'Não é possível alterar o status de um agendamento cancelado'
  end

  test "should only allow completed status from confirmed" do
    appointment = @account.appointments.create!(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: Time.current + 1.day,
      end_time: Time.current + 1.day + 1.hour,
      price_cents: 10000,
      whatsapp_number: "5511999999999",
      status: :pending
    )

    appointment.status = :completed
    assert_not appointment.valid?
    assert_includes appointment.errors[:status], 'Apenas agendamentos confirmados podem ser concluídos'
  end

  test "should only allow confirmed status from pending" do
    appointment = @account.appointments.create!(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: Time.current + 1.day,
      end_time: Time.current + 1.day + 1.hour,
      price_cents: 10000,
      whatsapp_number: "5511999999999",
      status: :completed
    )

    appointment.status = :confirmed
    assert_not appointment.valid?
    assert_includes appointment.errors[:status], 'Não é possível alterar o status de um agendamento concluído'
  end

  test "should update payment_status to refunded when canceling paid appointment" do
    appointment = @account.appointments.create!(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: Time.current + 1.day,
      end_time: Time.current + 1.day + 1.hour,
      price_cents: 10000,
      whatsapp_number: "5511999999999",
      status: :confirmed,
      payment_status: :paid
    )

    appointment.cancel!
    assert_equal :canceled, appointment.status
    assert_equal :refunded, appointment.payment_status
  end

  test "should destroy commissions when canceling paid appointment" do
    appointment = @account.appointments.create!(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: Time.current + 1.day,
      end_time: Time.current + 1.day + 1.hour,
      price_cents: 10000,
      whatsapp_number: "5511999999999",
      status: :confirmed,
      payment_status: :paid
    )

    # Criar comissão
    appointment.appointment_commissions.create!(
      account_user: @account_user,
      commission_type: 0,
      commission_value: 50.0,
      commission_amount_cents: 5000
    )

    assert_equal 1, appointment.appointment_commissions.count

    appointment.cancel!
    assert_equal 0, appointment.appointment_commissions.count
  end

  test "should not create duplicate commissions" do
    appointment = @account.appointments.create!(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: Time.current + 1.day,
      end_time: Time.current + 1.day + 1.hour,
      price_cents: 10000,
      whatsapp_number: "5511999999999",
      status: :confirmed,
      payment_status: :paid
    )

    # Chamar create_commissions múltiplas vezes (método privado acessado via send em testes)
    appointment.send(:create_commissions)
    appointment.send(:create_commissions)
    appointment.send(:create_commissions)

    # Deve ter apenas uma comissão
    assert_equal 1, appointment.appointment_commissions.count
  end
end

