class CoachingAssessment < ApplicationRecord
  belongs_to :account
  belongs_to :contact, foreign_key: :contact_id, class_name: 'Person'
  belongs_to :account_user, optional: true

  TYPES = %w[initial monthly quarterly annual custom].freeze

  validates :assessed_on,     presence: true
  validates :assessment_type, inclusion: { in: TYPES }

  scope :chronological, -> { order(assessed_on: :asc) }
end
