# frozen_string_literal: true

# == Schema Information
#
# Table name: coaching_insights
#
#  id            :bigint           not null, primary key
#  insight_type  :string           not null
#  insight_text  :text             not null
#  severity      :string           default("medium"), not null
#  related_dates :jsonb            default([]), not null
#  expires_at    :datetime
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  account_id    :bigint           not null
#  contact_id    :bigint           not null
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
