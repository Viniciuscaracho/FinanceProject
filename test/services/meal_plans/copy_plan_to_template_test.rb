# frozen_string_literal: true

require 'test_helper'

module MealPlans
  class CopyPlanToTemplateTest < ActiveSupport::TestCase
    setup do
      _, @account = register_user
      @contact = create_contact(@account)
      ActsAsTenant.current_tenant = @account

      @food = Food.create!(
        name: 'Arroz cozido', source: 'taco',
        kcal_per_100g: 128, protein_per_100g: 2.5,
        carbs_per_100g: 28.1, fat_per_100g: 0.2
      )

      @plan = @account.meal_plans.create!(contact_id: @contact.id, title: 'Plano verão')
      day  = @plan.meal_plan_days.create!(day_number: 1, label: 'Segunda-feira')
      meal = day.meals.create!(name: 'Almoço', position: 0, time_suggestion: '12:30')
      meal.meal_foods.create!(food: @food, quantity: 200, unit: 'g', position: 0)
    end

    teardown { ActsAsTenant.current_tenant = nil }

    test "creates a template with is_template true" do
      result = CopyPlanToTemplate.call(
        plan: @plan, account: @account,
        title: 'Template verão', template_category: 'outro'
      )

      assert result.success?
      assert result.template.is_template?
      assert_nil result.template.contact_id
    end

    test "uses given title and category" do
      result = CopyPlanToTemplate.call(
        plan: @plan, account: @account,
        title: 'Meu Modelo', template_category: 'low_carb'
      )

      assert_equal 'Meu Modelo', result.template.title
      assert_equal 'low_carb', result.template.template_category
    end

    test "falls back to plan title when title is blank" do
      result = CopyPlanToTemplate.call(
        plan: @plan, account: @account,
        title: '', template_category: 'outro'
      )

      assert_equal 'Plano verão', result.template.title
    end

    test "copies days, meals, and foods" do
      result = CopyPlanToTemplate.call(
        plan: @plan, account: @account,
        title: 'Template', template_category: 'outro'
      )

      tpl = result.template
      assert_equal 1, tpl.meal_plan_days.count
      assert_equal 1, tpl.meal_plan_days.first.meals.count

      mf = tpl.meal_plan_days.first.meals.first.meal_foods.first
      assert_equal @food, mf.food
      assert_equal 200, mf.quantity.to_i
    end

    test "copies meal time_suggestion" do
      result = CopyPlanToTemplate.call(
        plan: @plan, account: @account,
        title: 'T', template_category: 'outro'
      )

      meal = result.template.meal_plan_days.first.meals.first
      assert_equal '12:30', meal.time_suggestion
    end

    test "copies target macros from plan" do
      @plan.update!(target_kcal: 2000, target_protein_g: 150, target_carbs_g: 220)

      result = CopyPlanToTemplate.call(
        plan: @plan, account: @account,
        title: 'T', template_category: 'outro'
      )

      tpl = result.template
      assert_in_delta 2000.0, tpl.target_kcal
      assert_in_delta 150.0,  tpl.target_protein_g
      assert_in_delta 220.0,  tpl.target_carbs_g
    end

    test "original plan is unchanged" do
      CopyPlanToTemplate.call(
        plan: @plan, account: @account,
        title: 'Template', template_category: 'outro'
      )

      @plan.reload
      assert_not @plan.is_template?
      assert_equal @contact.id, @plan.contact_id
    end
  end
end
