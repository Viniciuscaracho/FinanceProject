# frozen_string_literal: true

require 'test_helper'

module Api
  module V1
    class MealPlansControllerTest < ActionDispatch::IntegrationTest
      setup do
        @user, @account = register_user
        @auth_token = generate_auth_token(@user)
        @contact = create_contact(@account)
        ActsAsTenant.current_tenant = @account

        @food = Food.create!(
          name: 'Frango grelhado', source: 'taco',
          kcal_per_100g: 163, protein_per_100g: 32.0,
          carbs_per_100g: 0.0, fat_per_100g: 3.2
        )
      end

      teardown { ActsAsTenant.current_tenant = nil }

      def auth = { 'Authorization' => "Bearer #{@auth_token}" }

      # ── GET index ──────────────────────────────────────────────────────────────

      test "index returns meal plans for contact" do
        plan = @account.meal_plans.create!(contact_id: @contact.id, title: 'Plano verão')

        get api_v1_contact_meal_plans_path(@contact), headers: auth

        assert_response :success
        body = JSON.parse(response.body)
        ids = body['meal_plans'].map { |p| p['id'] }
        assert_includes ids, plan.id
      end

      test "index does not return plans from other contacts" do
        other = create_contact(@account)
        mine  = @account.meal_plans.create!(contact_id: @contact.id, title: 'Meu')
        theirs = @account.meal_plans.create!(contact_id: other.id, title: 'Outro')

        get api_v1_contact_meal_plans_path(@contact), headers: auth

        body = JSON.parse(response.body)
        ids  = body['meal_plans'].map { |p| p['id'] }
        assert_includes ids, mine.id
        assert_not_includes ids, theirs.id
      end

      # ── POST create ────────────────────────────────────────────────────────────

      test "create saves a new plan" do
        post api_v1_contact_meal_plans_path(@contact),
             params: { meal_plan: { title: 'Plano emagrecimento' } },
             headers: auth

        assert_response :created
        body = JSON.parse(response.body)
        assert_equal 'Plano emagrecimento', body['meal_plan']['title']
        assert body['meal_plan']['public_token'].present?
        assert_equal 'draft', body['meal_plan']['status']
      end

      test "create returns 422 without title" do
        post api_v1_contact_meal_plans_path(@contact),
             params: { meal_plan: { title: '' } },
             headers: auth

        assert_response :unprocessable_entity
        body = JSON.parse(response.body)
        assert body['errors'].any?
      end

      # ── GET show ───────────────────────────────────────────────────────────────

      test "show returns plan with days and meals" do
        plan = @account.meal_plans.create!(contact_id: @contact.id, title: 'Plano')
        day  = plan.meal_plan_days.create!(day_number: 1, label: 'Segunda-feira')
        meal = day.meals.create!(name: 'Almoço', position: 0)
        meal.meal_foods.create!(food: @food, quantity: 150, unit: 'g', position: 0)

        get api_v1_contact_meal_plan_path(@contact, plan), headers: auth

        assert_response :success
        body = JSON.parse(response.body)
        mp = body['meal_plan']
        assert_equal 'Plano', mp['title']
        assert_equal 1, mp['days'].length
        assert_equal 1, mp['days'][0]['meals'].length
        assert_equal 1, mp['days'][0]['meals'][0]['foods'].length
        assert_equal 'Frango grelhado', mp['days'][0]['meals'][0]['foods'][0]['food_name']
      end

      # ── POST activate ──────────────────────────────────────────────────────────

      test "activate changes status to active" do
        plan = @account.meal_plans.create!(contact_id: @contact.id, title: 'Plano')

        post activate_api_v1_contact_meal_plan_path(@contact, plan), headers: auth

        assert_response :success
        plan.reload
        assert_equal :active, plan.status
      end

      # ── POST add_day ───────────────────────────────────────────────────────────

      test "add_day creates a day with sequential number" do
        plan = @account.meal_plans.create!(contact_id: @contact.id, title: 'Plano')

        post add_day_api_v1_contact_meal_plan_path(@contact, plan), headers: auth

        assert_response :created
        body = JSON.parse(response.body)
        assert_equal 1, body['day']['day_number']
        assert plan.meal_plan_days.exists?
      end

      test "add_day increments day_number" do
        plan = @account.meal_plans.create!(contact_id: @contact.id, title: 'Plano')
        plan.meal_plan_days.create!(day_number: 1)
        plan.meal_plan_days.create!(day_number: 2)

        post add_day_api_v1_contact_meal_plan_path(@contact, plan), headers: auth

        body = JSON.parse(response.body)
        assert_equal 3, body['day']['day_number']
      end

      # ── POST add_meal / add_food ───────────────────────────────────────────────

      test "add_meal creates meal inside day" do
        plan = @account.meal_plans.create!(contact_id: @contact.id, title: 'Plano')
        day  = plan.meal_plan_days.create!(day_number: 1)

        post "/api/v1/contacts/#{@contact.id}/meal_plans/#{plan.id}/days/#{day.id}/meals",
             params: { name: 'Café da manhã' },
             headers: auth

        assert_response :created
        body = JSON.parse(response.body)
        assert_equal 'Café da manhã', body['meal']['name']
        assert_equal 0, body['meal']['position']
      end

      test "add_food attaches food to meal with macro snapshot" do
        plan = @account.meal_plans.create!(contact_id: @contact.id, title: 'Plano')
        day  = plan.meal_plan_days.create!(day_number: 1)
        meal = day.meals.create!(name: 'Almoço', position: 0)

        post "/api/v1/contacts/#{@contact.id}/meal_plans/#{plan.id}/days/#{day.id}/meals/#{meal.id}/foods",
             params: { food_id: @food.id, quantity: 200, unit: 'g' },
             headers: auth

        assert_response :created
        body = JSON.parse(response.body)
        mf   = body['meal_food']
        assert_equal 'Frango grelhado', mf['food_name']
        assert_in_delta 326.0, mf['kcal'], 0.5
        assert_in_delta 64.0,  mf['protein'], 0.5
      end

      # ── PATCH update_food ──────────────────────────────────────────────────────

      test "update_food recalculates snapshots" do
        plan = @account.meal_plans.create!(contact_id: @contact.id, title: 'Plano')
        day  = plan.meal_plan_days.create!(day_number: 1)
        meal = day.meals.create!(name: 'Almoço', position: 0)
        mf   = meal.meal_foods.create!(food: @food, quantity: 100, unit: 'g', position: 0)

        patch "/api/v1/contacts/#{@contact.id}/meal_plans/#{plan.id}/days/#{day.id}/meals/#{meal.id}/foods/#{mf.id}",
              params: { quantity: 300 },
              headers: auth

        assert_response :success
        body = JSON.parse(response.body)
        assert_in_delta 489.0, body['meal_food']['kcal'], 0.5
      end

      # ── DELETE destroy ─────────────────────────────────────────────────────────

      test "destroy removes plan" do
        plan = @account.meal_plans.create!(contact_id: @contact.id, title: 'Plano')

        delete api_v1_contact_meal_plan_path(@contact, plan), headers: auth

        assert_response :success
        assert_not MealPlan.exists?(plan.id)
      end

      # ── Public endpoint ────────────────────────────────────────────────────────

      test "public show returns plan data when active" do
        plan = @account.meal_plans.create!(contact_id: @contact.id, title: 'Plano público', status: :active)
        day  = plan.meal_plan_days.create!(day_number: 1)
        meal = day.meals.create!(name: 'Almoço', position: 0)
        meal.meal_foods.create!(food: @food, quantity: 100, unit: 'g', position: 0)

        get "/api/v1/public/meal-plans/#{plan.public_token}"

        assert_response :success
        body = JSON.parse(response.body)
        assert_equal 'Plano público', body['meal_plan']['title']
        assert body['professional']['name'].present?
        assert body['patient']['name'].present?
        assert_equal 1, body['meal_plan']['days'].length
      end

      test "public show returns 404 for draft plan" do
        plan = @account.meal_plans.create!(contact_id: @contact.id, title: 'Rascunho', status: :draft)

        get "/api/v1/public/meal-plans/#{plan.public_token}"

        assert_response :not_found
      end

      test "public show returns 404 for invalid token" do
        get "/api/v1/public/meal-plans/token_invalido"
        assert_response :not_found
      end
    end
  end
end
