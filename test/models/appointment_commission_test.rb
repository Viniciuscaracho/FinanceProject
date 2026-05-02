# frozen_string_literal: true

# == Schema Information
#
# Table name: appointment_commissions
#
#  id                      :bigint           not null, primary key
#  commission_amount_cents :integer          not null
#  commission_type         :integer          not null
#  commission_value        :decimal(8, 2)    not null
#  created_at              :datetime         not null
#  updated_at              :datetime         not null
#  account_user_id         :bigint           not null
#  appointment_id          :bigint           not null
#
# Indexes
#
#  index_appointment_commissions_on_account_user_id  (account_user_id)
#  index_appointment_commissions_on_appointment_id   (appointment_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_user_id => account_users.id)
#  fk_rails_...  (appointment_id => appointments.id)
#
require 'test_helper'

class AppointmentCommissionTest < ActiveSupport::TestCase
  setup do
    _, @account = register_user
    @bank_account = create_bank_account(@account)
    @account_user = @account.account_users.first
    
    # Configurar horário de trabalho
    @account_user.update!(
      schedule: {
        'monday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
        'tuesday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
        'wednesday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
        'thursday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
        'friday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 }
      }
    )
    
    @service = create_service(@account)
    @contact = create_contact(@account)
    
    # Criar agendamento amanhã às 10h
    tomorrow = Time.current + 1.day
    start_time = tomorrow.beginning_of_day + 10.hours
    
    @appointment = @account.appointments.create!(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: start_time,
      end_time: start_time + 1.hour,
      price_cents: 10000,
      whatsapp_number: "5511999999999"
    )
  end

  test "should not allow duplicate commissions for same appointment and professional" do
    # Criar primeira comissão
    commission1 = @appointment.appointment_commissions.create!(
      account_user: @account_user,
      commission_type: 0,
      commission_value: 50.0,
      commission_amount_cents: 5000
    )

    # Tentar criar segunda comissão para mesmo profissional
    commission2 = @appointment.appointment_commissions.new(
      account_user: @account_user,
      commission_type: 0,
      commission_value: 50.0,
      commission_amount_cents: 5000
    )

    assert_not commission2.valid?
    assert_includes commission2.errors[:appointment_id], 'já possui uma comissão para este profissional'
  end

  test "should allow commissions for different professionals" do
    # Criar segundo usuário e account_user
    user2, _ = register_user(email: 'user2@test.com')
    account_user2 = @account.account_users.create!(user: user2, role: :custom)

    commission1 = @appointment.appointment_commissions.create!(
      account_user: @account_user,
      commission_type: 0,
      commission_value: 50.0,
      commission_amount_cents: 5000
    )

    commission2 = @appointment.appointment_commissions.new(
      account_user: account_user2,
      commission_type: 0,
      commission_value: 50.0,
      commission_amount_cents: 5000
    )

    assert commission2.valid?
  end
end

