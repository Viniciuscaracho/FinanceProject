# frozen_string_literal: true

# == Schema Information
#
# Table name: coaching_insights
#
#  id            :bigint           not null, primary key
#  expires_at    :datetime
#  insight_text  :text             not null
#  insight_type  :string           not null
#  related_dates :jsonb            not null
#  severity      :string           default("medium"), not null
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  account_id    :bigint           not null
#  contact_id    :bigint           not null
#
# Indexes
#
#  idx_coaching_insights_account_contact_date            (account_id,contact_id,created_at)
#  index_coaching_insights_on_account_id                 (account_id)
#  index_coaching_insights_on_account_id_and_created_at  (account_id,created_at)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (contact_id => people.id)
#
class CoachingInsight < ApplicationRecord
  belongs_to :account
  belongs_to :contact, foreign_key: :contact_id, class_name: 'Contact'

  TYPES      = %w[recurrence regression improvement absence_pattern].freeze
  SEVERITIES = %w[high medium low].freeze

  scope :active,       -> { where('expires_at > ?', Time.current) }
  scope :by_severity,  -> { order(Arel.sql("CASE severity WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, created_at DESC")) }
  scope :for_account,  ->(account) { where(account: account) }
end
