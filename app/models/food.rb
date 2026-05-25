# frozen_string_literal: true

# == Schema Information
#
# Table name: foods
#
#  id                :bigint           not null, primary key
#  carbs_per_100g    :decimal(8, 2)    default(0.0)
#  fat_per_100g      :decimal(8, 2)    default(0.0)
#  fiber_per_100g    :decimal(8, 2)    default(0.0)
#  kcal_per_100g     :decimal(8, 2)    default(0.0)
#  name              :string           not null
#  protein_per_100g  :decimal(8, 2)    default(0.0)
#  source            :string           default("custom"), not null
#  vitamins_per_100g :jsonb
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  account_id        :bigint
#  external_id       :string
#
# Indexes
#
#  index_foods_on_account_id  (account_id)
#  index_foods_on_name        (name)
#  index_foods_on_source      (source)
#
class Food < ApplicationRecord
  belongs_to :account, optional: true

  SOURCES = %w[taco open_food_facts custom].freeze

  validates :name, presence: true, length: { maximum: 200 }
  validates :source, inclusion: { in: SOURCES }

  scope :global,          -> { where(account_id: nil) }
  scope :for_account,     ->(account_id) { where(account_id: account_id) }
  scope :search,          ->(q) { where('unaccent(name) ILIKE unaccent(?)', "%#{q}%") }
  scope :taco,            -> { where(source: 'taco') }

  VITAMIN_KEYS = %w[
    vitamin_a_mcg vitamin_c_mg vitamin_d_mcg vitamin_b12_mcg
    calcium_mg iron_mg sodium_mg potassium_mg magnesium_mg zinc_mg
  ].freeze

  def macros_for(quantity_g)
    factor = quantity_g.to_f / 100.0
    {
      kcal:    (kcal_per_100g * factor).round(1),
      protein: (protein_per_100g * factor).round(1),
      carbs:   (carbs_per_100g * factor).round(1),
      fat:     (fat_per_100g * factor).round(1),
      fiber:   (fiber_per_100g * factor).round(1)
    }
  end

  def vitamins_for(quantity_g)
    factor = quantity_g.to_f / 100.0
    base = vitamins_per_100g || {}
    VITAMIN_KEYS.each_with_object({}) do |key, h|
      h[key] = ((base[key] || 0).to_f * factor).round(3)
    end
  end
end
