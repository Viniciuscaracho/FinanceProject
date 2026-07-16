# frozen_string_literal: true

# == Schema Information
#
# Table name: timeline_events
#
#  id              :bigint           not null, primary key
#  carga           :string
#  observacao      :text
#  proxima_acao    :text
#  raw_input       :text
#  sono            :string
#  source          :string           default("manual")
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  account_id      :bigint           not null
#  account_user_id :bigint
#  contact_id      :bigint           not null
#
# Indexes
#
#  idx_timeline_events_account_contact_date  (account_id,contact_id,created_at)
#  index_timeline_events_on_account_id       (account_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (account_user_id => account_users.id)
#  fk_rails_...  (contact_id => people.id)
#
require 'test_helper'

class TimelineEventTest < ActiveSupport::TestCase
  setup do
    _, @account = register_user
    @contact    = create_contact(@account)
    @account_user = @account.account_users.first
  end

  test 'creates with required fields' do
    event = TimelineEvent.new(
      account:    @account,
      contact:    @contact,
      raw_input:  'treinou bem hoje',
      source:     'manual'
    )
    assert event.save, event.errors.full_messages.to_s
  end

  test 'for_contact scope filters by contact' do
    other_contact = create_contact(@account)
    TimelineEvent.create!(account: @account, contact: @contact,    raw_input: 'a', source: 'manual')
    TimelineEvent.create!(account: @account, contact: other_contact, raw_input: 'b', source: 'manual')

    assert_equal 1, TimelineEvent.for_contact(@contact.id).count
  end

  test 'recent scope orders descending by created_at' do
    e1 = TimelineEvent.create!(account: @account, contact: @contact, raw_input: 'first',  source: 'manual')
    e2 = TimelineEvent.create!(account: @account, contact: @contact, raw_input: 'second', source: 'manual')

    ids = TimelineEvent.for_contact(@contact.id).recent.pluck(:id)
    assert_equal [e2.id, e1.id], ids
  end

  test 'search scope matches raw_input' do
    TimelineEvent.create!(account: @account, contact: @contact, raw_input: 'sono ruim ontem', source: 'manual')
    TimelineEvent.create!(account: @account, contact: @contact, raw_input: 'treino pesado',   source: 'manual')

    results = TimelineEvent.for_contact(@contact.id).search('sono')
    assert_equal 1, results.count
    assert_equal 'sono ruim ontem', results.first.raw_input
  end

  test 'search scope matches observacao' do
    TimelineEvent.create!(account: @account, contact: @contact, raw_input: 'nota', observacao: 'atleta motivado', source: 'manual')
    TimelineEvent.create!(account: @account, contact: @contact, raw_input: 'nota', observacao: 'cansado',         source: 'manual')

    assert_equal 1, TimelineEvent.for_contact(@contact.id).search('motivado').count
  end

  test 'after_create touches coaching_profile last_feedback_at' do
    profile = CoachingProfile.create!(account: @account, contact: @contact)
    original_feedback = profile.last_feedback_at

    travel_to 1.hour.from_now do
      TimelineEvent.create!(account: @account, contact: @contact, raw_input: 'nota', source: 'manual')
      assert profile.reload.last_feedback_at > (original_feedback || 1.year.ago)
    end
  end

  test 'after_create does nothing when coaching_profile absent' do
    assert_nothing_raised do
      TimelineEvent.create!(account: @account, contact: @contact, raw_input: 'nota', source: 'manual')
    end
  end

  test 'stores structured fields' do
    event = TimelineEvent.create!(
      account:      @account,
      contact:      @contact,
      raw_input:    'dormiu 7h, treino moderado',
      source:       'manual',
      sono:         '7h',
      carga:        'moderado',
      observacao:   'bem disposto',
      proxima_acao: 'aumentar volume semana que vem'
    )

    event.reload
    assert_equal '7h',                          event.sono
    assert_equal 'moderado',                    event.carga
    assert_equal 'bem disposto',                event.observacao
    assert_equal 'aumentar volume semana que vem', event.proxima_acao
  end
end
