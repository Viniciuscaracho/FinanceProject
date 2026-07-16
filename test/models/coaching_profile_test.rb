# frozen_string_literal: true

# == Schema Information
#
# Table name: coaching_profiles
#
#  id                   :bigint           not null, primary key
#  goal                 :text
#  last_feedback_at     :datetime
#  limitations          :text
#  next_reassessment_at :datetime
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#  account_id           :bigint           not null
#  contact_id           :bigint           not null
#
# Indexes
#
#  index_coaching_profiles_on_account_id                           (account_id)
#  index_coaching_profiles_on_account_id_and_last_feedback_at      (account_id,last_feedback_at)
#  index_coaching_profiles_on_account_id_and_next_reassessment_at  (account_id,next_reassessment_at)
#  index_coaching_profiles_on_contact_id                           (contact_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (contact_id => people.id)
#
require 'test_helper'

class CoachingProfileTest < ActiveSupport::TestCase
  setup do
    _, @account = register_user
    @contact    = create_contact(@account)
  end

  test 'creates and belongs to contact and account' do
    profile = CoachingProfile.create!(account: @account, contact: @contact, goal: 'perder peso')
    assert_equal @account, profile.account
    assert_equal @contact, profile.contact
    assert_equal 'perder peso', profile.goal
  end

  test 'sem_feedback_ha scope returns profiles with old or nil last_feedback_at' do
    old_profile  = CoachingProfile.create!(account: @account, contact: @contact,            last_feedback_at: 10.days.ago)
    new_contact  = create_contact(@account)
    _new_profile = CoachingProfile.create!(account: @account, contact: new_contact,          last_feedback_at: 1.day.ago)
    nil_contact  = create_contact(@account)
    nil_profile  = CoachingProfile.create!(account: @account, contact: nil_contact,          last_feedback_at: nil)

    Current.account = @account
    results = CoachingProfile.sem_feedback_ha(7)
    ids = results.pluck(:id)

    assert_includes ids, old_profile.id
    assert_includes ids, nil_profile.id
    assert_not_includes ids, _new_profile.id
  end

  test 'reavaliacoes_proximas scope returns profiles within window' do
    soon_contact = create_contact(@account)
    soon_profile = CoachingProfile.create!(account: @account, contact: soon_contact, next_reassessment_at: 3.days.from_now)

    far_contact  = create_contact(@account)
    _far_profile = CoachingProfile.create!(account: @account, contact: far_contact,  next_reassessment_at: 30.days.from_now)

    Current.account = @account
    results = CoachingProfile.reavaliacoes_proximas(7)

    assert_includes results.pluck(:id), soon_profile.id
    assert_not_includes results.pluck(:id), _far_profile.id
  end

  test 'contact has_one coaching_profile' do
    profile = CoachingProfile.create!(account: @account, contact: @contact)
    assert_equal profile, @contact.reload.coaching_profile
  end

  test 'coaching_profile destroyed with contact' do
    profile = CoachingProfile.create!(account: @account, contact: @contact)
    profile_id = profile.id
    @contact.destroy!
    assert_nil CoachingProfile.find_by(id: profile_id)
  end
end
