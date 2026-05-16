# frozen_string_literal: true

# == Schema Information
#
# Table name: anamnese_responses
#
#  id                   :bigint           not null, primary key
#  filled_at            :datetime
#  responses            :jsonb            not null
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#  account_id           :bigint           not null
#  anamnese_template_id :bigint
#  appointment_id       :bigint           not null
#  contact_id           :bigint
#
# Indexes
#
#  index_anamnese_responses_on_account_id                     (account_id)
#  index_anamnese_responses_on_account_id_and_appointment_id  (account_id,appointment_id) UNIQUE
#  index_anamnese_responses_on_anamnese_template_id           (anamnese_template_id)
#  index_anamnese_responses_on_appointment_id                 (appointment_id)
#  index_anamnese_responses_on_contact_id                     (contact_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (anamnese_template_id => anamnese_templates.id)
#  fk_rails_...  (appointment_id => appointments.id)
#  fk_rails_...  (contact_id => people.id)
#
require 'test_helper'

class AnamneseResponseTest < ActiveSupport::TestCase
  setup do
    _, @account = register_user
    @bank_account = create_bank_account(@account)
    @account_user = @account.account_users.first
    @account_user.update!(
      schedule: {
        'monday'    => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
        'tuesday'   => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
        'wednesday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
        'thursday'  => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
        'friday'    => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
      }
    )
    @service  = create_service(@account)
    @contact  = create_contact(@account)
    ActsAsTenant.current_tenant = @account

    tomorrow   = next_weekday_at(10)
    @appointment = @account.appointments.create!(
      account_user:    @account_user,
      service:         @service,
      contact:         @contact,
      start_time:      tomorrow,
      end_time:        tomorrow + 1.hour,
      price_cents:     5000,
      whatsapp_number: '5511900000001',
      status:          :confirmed,
      payment_status:  :paid
    )
  end

  teardown { ActsAsTenant.current_tenant = nil }

  test "should create response for appointment" do
    resp = @account.anamnese_responses.create!(
      appointment: @appointment,
      responses:   { 'q1' => 'Emagrecimento' }
    )
    assert resp.persisted?
    assert_equal @appointment.id, resp.appointment_id
  end

  test "should set filled_at on save when responses present" do
    resp = @account.anamnese_responses.create!(
      appointment: @appointment,
      responses:   { 'q1' => 'Sim' }
    )
    assert_not_nil resp.filled_at
  end

  test "should not set filled_at when responses empty" do
    resp = @account.anamnese_responses.create!(
      appointment: @appointment,
      responses:   {}
    )
    assert_nil resp.filled_at
  end

  test "enforces uniqueness per appointment" do
    @account.anamnese_responses.create!(appointment: @appointment, responses: { 'x' => '1' })

    dup = @account.anamnese_responses.build(appointment: @appointment, responses: { 'x' => '2' })
    assert_not dup.valid?
    assert_includes dup.errors[:appointment_id], 'já possui uma anamnese'
  end

  test "belongs to optional anamnese_template" do
    tpl  = @account.anamnese_templates.create!(name: 'Nutr', fields: [])
    resp = @account.anamnese_responses.create!(
      appointment:      @appointment,
      anamnese_template: tpl,
      responses:        { 'f1' => 'ok' }
    )
    assert_equal tpl.id, resp.anamnese_template_id
  end

  private

  def next_weekday_at(hour)
    t = Time.current + 1.day
    t = t + 1.day while [0, 6].include?(t.wday)
    t.beginning_of_day + hour.hours
  end
end
