# frozen_string_literal: true

# == Schema Information
#
# Table name: meal_foods
#
#  id               :bigint           not null, primary key
#  carbs_snapshot   :decimal(8, 2)    default(0.0)
#  fat_snapshot     :decimal(8, 2)    default(0.0)
#  kcal_snapshot    :decimal(8, 2)    default(0.0)
#  notes            :text
#  position         :integer          default(0), not null
#  protein_snapshot :decimal(8, 2)    default(0.0)
#  quantity         :decimal(8, 2)    default(100.0), not null
#  unit             :string           default("g"), not null
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  food_id          :bigint           not null
#  meal_id          :bigint           not null
#
# Indexes
#
#  index_meal_foods_on_food_id  (food_id)
#  index_meal_foods_on_meal_id  (meal_id)
#
require 'test_helper'

class MealFoodTest < ActiveSupport::TestCase
  setup do
    _, @account = register_user
    @contact = create_contact(@account)
    ActsAsTenant.current_tenant = @account

    @food = Food.create!(
      name: 'Frango grelhado', source: 'taco',
      kcal_per_100g: 163, protein_per_100g: 32.0,
      carbs_per_100g: 0.0, fat_per_100g: 3.2
    )

    @plan = @account.meal_plans.create!(contact_id: @contact.id, title: 'Plano')
    @day  = @plan.meal_plan_days.create!(day_number: 1)
    @meal = @day.meals.create!(name: 'Almoço', position: 0)
  end

  teardown { ActsAsTenant.current_tenant = nil }

  test "creates and computes snapshots" do
    mf = @meal.meal_foods.create!(food: @food, quantity: 200, unit: 'g', position: 0)
    assert_in_delta 326.0, mf.kcal_snapshot.to_f,    0.1
    assert_in_delta 64.0,  mf.protein_snapshot.to_f, 0.1
    assert_in_delta 0.0,   mf.carbs_snapshot.to_f,   0.1
    assert_in_delta 6.4,   mf.fat_snapshot.to_f,     0.1
  end

  test "recomputes snapshots when quantity changes" do
    mf = @meal.meal_foods.create!(food: @food, quantity: 100, unit: 'g', position: 0)
    mf.update!(quantity: 150)
    assert_in_delta 244.5, mf.kcal_snapshot.to_f, 0.1
  end

  test "requires positive quantity" do
    mf = @meal.meal_foods.build(food: @food, quantity: 0, unit: 'g', position: 0)
    assert_not mf.valid?
    assert mf.errors[:quantity].any?
  end

  test "requires unit" do
    mf = @meal.meal_foods.build(food: @food, quantity: 100, unit: '', position: 0)
    assert_not mf.valid?
  end

  test "meal totals aggregate all foods" do
    food2 = Food.create!(name: 'Arroz', source: 'taco', kcal_per_100g: 128,
                         protein_per_100g: 2.5, carbs_per_100g: 28.1, fat_per_100g: 0.2)
    @meal.meal_foods.create!(food: @food, quantity: 100, unit: 'g', position: 0)
    @meal.meal_foods.create!(food: food2, quantity: 100, unit: 'g', position: 1)
    @meal.reload
    assert_in_delta 291.0, @meal.total_kcal, 0.5
    assert_in_delta 34.5,  @meal.total_protein, 0.5
  end
end
