# frozen_string_literal: true

# == Schema Information
#
# Table name: meal_plans
#
#  id           :bigint           not null, primary key
#  description  :text
#  end_date     :date
#  notes        :text
#  public_token :string           not null
#  start_date   :date
#  status       :integer          default(0), not null
#  title        :string           not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  account_id   :bigint           not null
#  contact_id   :bigint           not null
#
# Indexes
#
#  index_meal_plans_on_account_id                 (account_id)
#  index_meal_plans_on_account_id_and_contact_id  (account_id,contact_id)
#  index_meal_plans_on_contact_id                 (contact_id)
#  index_meal_plans_on_public_token               (public_token) UNIQUE
#
class MealPlan < ApplicationRecord
  acts_as_tenant :account

  belongs_to :account
  belongs_to :contact, class_name: 'Contact', foreign_key: 'contact_id'
  has_many   :meal_plan_days, dependent: :destroy
  has_many   :meals, through: :meal_plan_days

  STATUSES = { draft: 0, active: 1, archived: 2 }.freeze
  as_enum :status, STATUSES, source: :status

  before_create :generate_public_token

  validates :title,      presence: true, length: { maximum: 200 }
  validates :contact_id, presence: true
  validates :public_token, uniqueness: true

  scope :recent,      -> { order(updated_at: :desc) }
  scope :active,      -> { where(status: STATUSES[:active]) }
  scope :for_contact, ->(contact_id) { where(contact_id: contact_id) }

  def total_days
    meal_plan_days.size
  end

  def public_url
    base = ENV.fetch('FRONTEND_URL', 'http://localhost:5173')
    "#{base}/plano/#{public_token}"
  end

  private

  def generate_public_token
    loop do
      token = SecureRandom.urlsafe_base64(16)
      unless MealPlan.exists?(public_token: token)
        self.public_token = token
        break
      end
    end
  end
end
