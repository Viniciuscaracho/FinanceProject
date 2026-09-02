# frozen_string_literal: true

# == Schema Information
#
# Table name: timeline_events
#
#  id              :bigint           not null, primary key
#  carga           :string
#  carga_score     :integer
#  extras          :jsonb
#  humor_score     :integer
#  observacao      :text
#  proxima_acao    :text
#  raw_input       :text
#  sono            :string
#  sono_score      :integer
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
#  idx_timeline_events_contact_carga_score   (contact_id,carga_score) WHERE (carga_score IS NOT NULL)
#  idx_timeline_events_contact_sono_score    (contact_id,sono_score) WHERE (sono_score IS NOT NULL)
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

  after_create  :update_coaching_profile_feedback_at
  after_commit  :schedule_context_analysis, on: :create

  scope :for_contact, ->(contact_id) { where(contact_id: contact_id) }
  scope :recent, -> { order(created_at: :desc) }
  scope :search, ->(q) {
    where('raw_input ILIKE :q OR observacao ILIKE :q', q: "%#{q}%")
  }

  private

  def update_coaching_profile_feedback_at
    contact.coaching_profile&.touch(:last_feedback_at)
  end

  def schedule_context_analysis
    Coaching::ContextAnalysisJob.perform_later(account_id, contact_id, id)
  end
end
