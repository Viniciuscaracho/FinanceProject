# frozen_string_literal: true

# == Schema Information
#
# Table name: english_cards
#
#  id                 :bigint           not null, primary key
#  back               :text             not null
#  card_type          :string           not null
#  example            :text
#  front              :text             not null
#  next_review_at     :datetime
#  review_count       :integer          default(0), not null
#  status             :string           default("learning"), not null
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  english_session_id :bigint
#  user_id            :bigint           not null
#
# Indexes
#
#  index_english_cards_on_english_session_id     (english_session_id)
#  index_english_cards_on_user_id                (user_id)
#  index_english_cards_on_user_id_and_card_type  (user_id,card_type)
#  index_english_cards_on_user_id_and_status     (user_id,status)
#
# Foreign Keys
#
#  fk_rails_...  (english_session_id => english_sessions.id)
#  fk_rails_...  (user_id => users.id)
#
class EnglishCard < ApplicationRecord
  belongs_to :user
  belongs_to :english_session, optional: true

  enum card_type: { vocabulary: 'vocabulary', mistake: 'mistake', phrase: 'phrase' }
  enum status: { learning: 'learning', known: 'known' }

  scope :for_review, -> { where('next_review_at IS NULL OR next_review_at <= ?', Time.current) }
  scope :by_type, ->(type) { where(card_type: type) }
end
