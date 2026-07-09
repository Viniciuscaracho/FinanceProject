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
class CoachingProfile < ApplicationRecord
  belongs_to :contact
  belongs_to :account

  scope :sem_feedback_ha, ->(dias) {
    where(account_id: Current.account.id)
      .where('last_feedback_at < ? OR last_feedback_at IS NULL', dias.days.ago)
  }

  scope :reavaliacoes_proximas, ->(dias) {
    where(account_id: Current.account.id)
      .where(next_reassessment_at: Time.current..dias.days.from_now)
  }
end
