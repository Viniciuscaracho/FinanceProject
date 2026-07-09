# frozen_string_literal: true

require 'test_helper'

class Coaching::DetectorServiceTest < ActiveSupport::TestCase
  setup do
    _, @account = register_user
    @contact    = create_contact(@account)
  end

  test 'returns empty array when no profiles exist' do
    alerts = Coaching::DetectorService.new(@account).call
    assert_empty alerts
  end

  test 'detects sem_feedback when last_feedback_at is nil' do
    CoachingProfile.create!(account: @account, contact: @contact, last_feedback_at: nil)

    alerts = Coaching::DetectorService.new(@account).call

    sem_feedback = alerts.select { |a| a[:alert_type] == 'sem_feedback' }
    assert_equal 1, sem_feedback.size
    assert_equal @contact.id,   sem_feedback.first[:contact_id]
    assert_equal @contact.name, sem_feedback.first[:contact_name]
    assert_nil sem_feedback.first[:days_since]
  end

  test 'detects sem_feedback when last_feedback_at is older than 7 days' do
    CoachingProfile.create!(account: @account, contact: @contact, last_feedback_at: 10.days.ago)

    alerts = Coaching::DetectorService.new(@account).call

    assert_equal 1, alerts.select { |a| a[:alert_type] == 'sem_feedback' }.size
  end

  test 'does not flag sem_feedback when feedback is recent' do
    CoachingProfile.create!(account: @account, contact: @contact, last_feedback_at: 2.days.ago)

    alerts = Coaching::DetectorService.new(@account).call
    assert_empty alerts.select { |a| a[:alert_type] == 'sem_feedback' }
  end

  test 'detects reavaliacao_proxima within 7 days' do
    CoachingProfile.create!(account: @account, contact: @contact,
                            last_feedback_at: 1.day.ago,
                            next_reassessment_at: 5.days.from_now)

    alerts = Coaching::DetectorService.new(@account).call

    reavaliacao = alerts.select { |a| a[:alert_type] == 'reavaliacao_proxima' }
    assert_equal 1, reavaliacao.size
    assert reavaliacao.first[:days_until] >= 0
  end

  test 'does not flag reavaliacao when it is more than 7 days away' do
    CoachingProfile.create!(account: @account, contact: @contact,
                            last_feedback_at: 1.day.ago,
                            next_reassessment_at: 30.days.from_now)

    alerts = Coaching::DetectorService.new(@account).call
    assert_empty alerts.select { |a| a[:alert_type] == 'reavaliacao_proxima' }
  end

  test 'does not return alerts from other accounts' do
    _, other_account = register_user
    other_contact    = create_contact(other_account)
    CoachingProfile.create!(account: other_account, contact: other_contact, last_feedback_at: nil)

    alerts = Coaching::DetectorService.new(@account).call
    assert_empty alerts
  end

  test 'can return both alert types for the same contact' do
    CoachingProfile.create!(account: @account, contact: @contact,
                            last_feedback_at:      nil,
                            next_reassessment_at:  3.days.from_now)

    alerts = Coaching::DetectorService.new(@account).call
    types  = alerts.map { |a| a[:alert_type] }

    assert_includes types, 'sem_feedback'
    assert_includes types, 'reavaliacao_proxima'
  end
end
