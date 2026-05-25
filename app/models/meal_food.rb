# frozen_string_literal: true

# == Schema Information
#
# Table name: meal_foods
#
#  id                :bigint           not null, primary key
#  carbs_snapshot    :decimal(8, 2)    default(0.0)
#  fat_snapshot      :decimal(8, 2)    default(0.0)
#  fiber_snapshot    :decimal(8, 2)    default(0.0)
#  kcal_snapshot     :decimal(8, 2)    default(0.0)
#  notes             :text
#  position          :integer          default(0), not null
#  protein_snapshot  :decimal(8, 2)    default(0.0)
#  quantity          :decimal(8, 2)    default(100.0), not null
#  unit              :string           default("g"), not null
#  vitamins_snapshot :jsonb
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  food_id           :bigint           not null
#  meal_id           :bigint           not null
#
# Indexes
#
#  index_meal_foods_on_food_id  (food_id)
#  index_meal_foods_on_meal_id  (meal_id)
#
class MealFood < ApplicationRecord
  belongs_to :meal
  belongs_to :food

  validates :quantity, numericality: { greater_than: 0 }
  validates :unit,     presence: true

  before_save :compute_snapshots

  scope :ordered, -> { order(:position) }

  private

  def compute_snapshots
    factor = quantity.to_f / 100.0
    self.kcal_snapshot    = (food.kcal_per_100g    * factor).round(2)
    self.protein_snapshot = (food.protein_per_100g * factor).round(2)
    self.carbs_snapshot   = (food.carbs_per_100g   * factor).round(2)
    self.fat_snapshot     = (food.fat_per_100g     * factor).round(2)
    self.fiber_snapshot   = (food.fiber_per_100g   * factor).round(2)
    self.vitamins_snapshot = food.vitamins_for(quantity.to_f)
  end
end
