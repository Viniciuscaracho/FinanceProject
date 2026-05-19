# frozen_string_literal: true

# == Schema Information
#
# Table name: meals
#
#  id               :bigint           not null, primary key
#  name             :string           not null
#  notes            :text
#  position         :integer          default(0), not null
#  time_suggestion  :string
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  meal_plan_day_id :bigint           not null
#
# Indexes
#
#  index_meals_on_meal_plan_day_id               (meal_plan_day_id)
#  index_meals_on_meal_plan_day_id_and_position  (meal_plan_day_id,position)
#
class Meal < ApplicationRecord
  belongs_to :meal_plan_day
  has_many   :meal_foods, dependent: :destroy
  has_many   :foods, through: :meal_foods

  DEFAULTS = ['Café da manhã', 'Lanche da manhã', 'Almoço', 'Lanche da tarde', 'Jantar', 'Ceia'].freeze

  validates :name, presence: true, length: { maximum: 100 }

  scope :ordered, -> { order(:position) }

  def total_kcal
    meal_foods.sum(&:kcal_snapshot)
  end

  def total_protein
    meal_foods.sum(&:protein_snapshot)
  end

  def total_carbs
    meal_foods.sum(&:carbs_snapshot)
  end

  def total_fat
    meal_foods.sum(&:fat_snapshot)
  end
end
