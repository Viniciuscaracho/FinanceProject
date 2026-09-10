# frozen_string_literal: true

# == Schema Information
#
# Table name: english_sessions
#
#  id          :bigint           not null, primary key
#  raw_content :text
#  status      :string           default("pending"), not null
#  summary     :text
#  url         :string
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  user_id     :bigint           not null
#
# Indexes
#
#  index_english_sessions_on_user_id                 (user_id)
#  index_english_sessions_on_user_id_and_created_at  (user_id,created_at)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
class EnglishSession < ApplicationRecord
  belongs_to :user
  has_many :english_cards, dependent: :destroy

  enum status: { pending: 'pending', processed: 'processed', failed: 'failed' }

  scope :recent, -> { order(created_at: :desc) }

  def cards_count
    english_cards.count
  end
end
