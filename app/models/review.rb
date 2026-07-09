# frozen_string_literal: true

# == Schema Information
#
# Table name: reviews
#
#  id             :bigint           not null, primary key
#  approved       :boolean          default(TRUE), not null
#  comment        :text
#  rating         :integer          not null
#  reviewer_email :string
#  reviewer_name  :string           not null
#  source         :string           default("direct")
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#  account_id     :bigint           not null
#  appointment_id :bigint
#
# Indexes
#
#  index_reviews_on_account_id               (account_id)
#  index_reviews_on_account_id_and_approved  (account_id,approved)
#  index_reviews_on_created_at               (created_at)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
class Review < ApplicationRecord
  belongs_to :account

  validates :reviewer_name, presence: true, length: { maximum: 100 }
  validates :reviewer_email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true
  validates :rating, presence: true, inclusion: { in: 1..5 }
  validates :comment, length: { maximum: 1000 }, allow_blank: true

  scope :approved, -> { where(approved: true) }
  scope :recent,   -> { order(created_at: :desc) }

  after_save :update_account_rating_cache

  private

  def update_account_rating_cache
    stats = account.reviews.approved
    count = stats.count
    avg   = count > 0 ? stats.average(:rating).to_f.round(1) : nil

    prefs = account.preferences.merge(
      'ratings_count'   => count,
      'ratings_average' => avg,
    )
    account.update_column(:preferences, prefs)
  end
end
