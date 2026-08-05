# frozen_string_literal: true

# == Schema Information
#
# Table name: meal_plans
#
#  id                :bigint           not null, primary key
#  description       :text
#  end_date          :date
#  is_template       :boolean          default(FALSE), not null
#  notes             :text
#  public_token      :string           not null
#  start_date        :date
#  status            :integer          default(0), not null
#  target_carbs_g    :decimal(8, 2)    default(0.0)
#  target_fat_g      :decimal(8, 2)    default(0.0)
#  target_fiber_g    :decimal(8, 2)    default(0.0)
#  target_kcal       :decimal(8, 2)    default(0.0)
#  target_protein_g  :decimal(8, 2)    default(0.0)
#  template_category :string
#  title             :string           not null
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  account_id        :bigint           not null
#  contact_id        :bigint
#
# Indexes
#
#  index_meal_plans_on_account_id                 (account_id)
#  index_meal_plans_on_account_id_and_contact_id  (account_id,contact_id)
#  index_meal_plans_on_contact_id                 (contact_id)
#  index_meal_plans_on_is_template                (is_template)
#  index_meal_plans_on_public_token               (public_token) UNIQUE
#
class MealPlan < ApplicationRecord
  acts_as_tenant :account

  TEMPLATE_CATEGORIES = %w[
    low_carb hipertrofia mediterraneo vegetariano emagrecimento
    corrida crossfit esportes_coletivos natacao artes_marciais
    outro
  ].freeze

  belongs_to :account
  belongs_to :contact, class_name: 'Contact', foreign_key: 'contact_id', optional: true
  has_many   :meal_plan_days, dependent: :destroy
  has_many   :meals, through: :meal_plan_days

  STATUSES = { draft: 0, active: 1, archived: 2 }.freeze
  as_enum :status, STATUSES, source: :status

  before_create :generate_public_token

  validates :title,      presence: true, length: { maximum: 200 }
  validates :contact_id, presence: true, unless: :is_template?
  validates :public_token, uniqueness: true
  validates :template_category, inclusion: { in: TEMPLATE_CATEGORIES }, allow_nil: true

  scope :recent,      -> { order(updated_at: :desc) }
  scope :active,      -> { where(status: STATUSES[:active]) }
  scope :for_contact, ->(contact_id) { where(contact_id: contact_id) }
  scope :templates,   -> { where(is_template: true) }
  scope :plans,       -> { where(is_template: false) }

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
