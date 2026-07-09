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
class TimelineEvent < ApplicationRecord
  belongs_to :account
  belongs_to :contact, foreign_key: :contact_id, class_name: 'Contact'
  belongs_to :account_user, optional: true

  after_create :update_coaching_profile_feedback_at

  scope :for_contact, ->(contact_id) { where(contact_id: contact_id) }
  scope :recent, -> { order(created_at: :desc) }
  scope :search, ->(q) {
    where('raw_input ILIKE :q OR observacao ILIKE :q', q: "%#{q}%")
  }

  private

  def update_coaching_profile_feedback_at
    contact.coaching_profile&.touch(:last_feedback_at)
  end
end
