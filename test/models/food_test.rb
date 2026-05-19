# frozen_string_literal: true

# == Schema Information
#
# Table name: foods
#
#  id               :bigint           not null, primary key
#  carbs_per_100g   :decimal(8, 2)    default(0.0)
#  fat_per_100g     :decimal(8, 2)    default(0.0)
#  fiber_per_100g   :decimal(8, 2)    default(0.0)
#  kcal_per_100g    :decimal(8, 2)    default(0.0)
#  name             :string           not null
#  protein_per_100g :decimal(8, 2)    default(0.0)
#  source           :string           default("custom"), not null
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  account_id       :bigint
#  external_id      :string
#
# Indexes
#
#  index_foods_on_account_id  (account_id)
#  index_foods_on_name        (name)
#  index_foods_on_source      (source)
#
require 'test_helper'

class FoodTest < ActiveSupport::TestCase
  setup do
    _, @account = register_user
    ActsAsTenant.current_tenant = @account
  end

  teardown { ActsAsTenant.current_tenant = nil }

  test "valid global food (TACO)" do
    food = Food.new(name: 'Arroz branco cozido', source: 'taco',
                    kcal_per_100g: 128, protein_per_100g: 2.5,
                    carbs_per_100g: 28.1, fat_per_100g: 0.2)
    assert food.valid?
  end

  test "requires name" do
    food = Food.new(source: 'taco')
    assert_not food.valid?
    assert food.errors[:name].any?
  end

  test "requires valid source" do
    food = Food.new(name: 'Algo', source: 'invalido')
    assert_not food.valid?
  end

  test "global scope returns foods without account_id" do
    global = Food.create!(name: 'Global', source: 'taco', account_id: nil)
    custom = Food.create!(name: 'Custom', source: 'custom', account_id: @account.id)
    assert_includes Food.global, global
    assert_not_includes Food.global, custom
  end

  test "for_account scope returns foods of that account" do
    custom = Food.create!(name: 'Meu alimento', source: 'custom', account_id: @account.id)
    global = Food.create!(name: 'Global', source: 'taco', account_id: nil)
    scoped = Food.for_account(@account.id)
    assert_includes scoped, custom
    assert_not_includes scoped, global
  end

  test "search finds by partial name case-insensitive" do
    Food.create!(name: 'Arroz branco cozido', source: 'taco')
    Food.create!(name: 'Feijão carioca', source: 'taco')
    results = Food.search('arroz')
    assert results.any? { |f| f.name.downcase.include?('arroz') }
    assert_not results.any? { |f| f.name.downcase.include?('feijão') }
  end

  test "macros_for calculates proportionally" do
    food = Food.new(kcal_per_100g: 128, protein_per_100g: 2.5,
                    carbs_per_100g: 28.1, fat_per_100g: 0.2, fiber_per_100g: 1.6)
    macros = food.macros_for(200)
    assert_in_delta 256.0, macros[:kcal],    0.1
    assert_in_delta 5.0,   macros[:protein], 0.1
    assert_in_delta 56.2,  macros[:carbs],   0.1
    assert_in_delta 0.4,   macros[:fat],     0.1
  end

  test "macros_for with 0 returns zeros" do
    food = Food.new(kcal_per_100g: 128, protein_per_100g: 2.5, carbs_per_100g: 28.1, fat_per_100g: 0.2)
    macros = food.macros_for(0)
    assert_equal 0.0, macros[:kcal]
  end
end
