# frozen_string_literal: true

# == Schema Information
#
# Table name: meal_plan_days
#
#  id           :bigint           not null, primary key
#  day_number   :integer          not null
#  label        :string
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  meal_plan_id :bigint           not null
#
# Indexes
#
#  index_meal_plan_days_on_meal_plan_id                 (meal_plan_id)
#  index_meal_plan_days_on_meal_plan_id_and_day_number  (meal_plan_id,day_number) UNIQUE
#
class MealPlanDay < ApplicationRecord
  belongs_to :meal_plan
  has_many   :meals, dependent: :destroy

  DAY_LABELS = {
    1 => 'Segunda-feira',
    2 => 'Terça-feira',
    3 => 'Quarta-feira',
    4 => 'Quinta-feira',
    5 => 'Sexta-feira',
    6 => 'Sábado',
    7 => 'Domingo'
  }.freeze

  validates :day_number, presence: true,
                         numericality: { only_integer: true, greater_than: 0 },
                         uniqueness: { scope: :meal_plan_id }

  scope :ordered, -> { order(:day_number) }

  def display_label
    label.presence || DAY_LABELS[day_number] || "Dia #{day_number}"
  end
end
