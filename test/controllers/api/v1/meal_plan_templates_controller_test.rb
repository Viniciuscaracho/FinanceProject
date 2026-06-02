# frozen_string_literal: true

require 'test_helper'

module Api
  module V1
    class MealPlanTemplatesControllerTest < ActionDispatch::IntegrationTest
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

        @template = @account.meal_plans.create!(
          title: 'Low Carb Base',
          template_category: 'low_carb',
          is_template: true
        )
      end

      teardown { ActsAsTenant.current_tenant = nil }

      def auth = { 'Authorization' => "Bearer #{@auth_token}" }

      # ── GET index ──────────────────────────────────────────────────────────────

      test "index returns templates for the account" do
        get api_v1_meal_plan_templates_path, headers: auth

        assert_response :success
        body = JSON.parse(response.body)
        ids = body['templates'].map { |t| t['id'] }
        assert_includes ids, @template.id
      end

      test "index does not return regular plans" do
        plan = @account.meal_plans.create!(contact_id: @contact.id, title: 'Plano paciente')

        get api_v1_meal_plan_templates_path, headers: auth

        body = JSON.parse(response.body)
        ids = body['templates'].map { |t| t['id'] }
        assert_not_includes ids, plan.id
      end

      test "index does not return templates from other accounts" do
        _, other_account = register_user
        ActsAsTenant.with_tenant(other_account) do
          other_account.meal_plans.create!(title: 'Outro', is_template: true)
        end

        get api_v1_meal_plan_templates_path, headers: auth

        body = JSON.parse(response.body)
        assert_equal 1, body['templates'].length
      end

      test "index returns target fields in summary" do
        @template.update!(target_kcal: 1600, target_protein_g: 120)

        get api_v1_meal_plan_templates_path, headers: auth

        body = JSON.parse(response.body)
        tpl = body['templates'].find { |t| t['id'] == @template.id }
        assert_in_delta 1600.0, tpl['target_kcal']
        assert_in_delta 120.0,  tpl['target_protein_g']
      end

      test "index returns 401 without auth" do
        get api_v1_meal_plan_templates_path
        assert_response :unauthorized
      end

      # ── GET show ───────────────────────────────────────────────────────────────

      test "show returns full template with days" do
        day  = @template.meal_plan_days.create!(day_number: 1, label: 'Dia Tipo A')
        meal = day.meals.create!(name: 'Almoço', position: 0)
        meal.meal_foods.create!(food: @food, quantity: 150, unit: 'g', position: 0)

        get api_v1_meal_plan_template_path(@template), headers: auth

        assert_response :success
        body = JSON.parse(response.body)
        tpl  = body['template']
        assert_equal 'Low Carb Base', tpl['title']
        assert_equal 'low_carb', tpl['template_category']
        assert_equal 1, tpl['days'].length
        assert_equal 1, tpl['days'][0]['meals'].length
        assert_equal 1, tpl['days'][0]['meals'][0]['foods'].length
      end

      test "show returns 404 for unknown template" do
        get api_v1_meal_plan_template_path(id: 999_999), headers: auth
        assert_response :not_found
      end

      test "show returns 404 for a plan that is not a template" do
        plan = @account.meal_plans.create!(contact_id: @contact.id, title: 'Plano')
        get api_v1_meal_plan_template_path(id: plan.id), headers: auth
        assert_response :not_found
      end

      # ── POST create ────────────────────────────────────────────────────────────

      test "create saves a new template" do
        post api_v1_meal_plan_templates_path,
             params: { meal_plan: { title: 'Hipertrofia Base', template_category: 'hipertrofia' } },
             headers: auth

        assert_response :created
        body = JSON.parse(response.body)
        assert_equal 'Hipertrofia Base', body['template']['title']
        assert_equal 'hipertrofia', body['template']['template_category']
        assert MealPlan.find(body['template']['id']).is_template?
      end

      test "create persists target fields" do
        post api_v1_meal_plan_templates_path,
             params: { meal_plan: { title: 'Com metas', template_category: 'outro',
                                    target_kcal: 2000, target_protein_g: 150 } },
             headers: auth

        assert_response :created
        body = JSON.parse(response.body)
        assert_in_delta 2000.0, body['template']['target_kcal']
        assert_in_delta 150.0,  body['template']['target_protein_g']
      end

      test "create returns 422 without title" do
        post api_v1_meal_plan_templates_path,
             params: { meal_plan: { title: '' } },
             headers: auth

        assert_response :unprocessable_entity
        assert JSON.parse(response.body)['errors'].any?
      end

      # ── PATCH update ───────────────────────────────────────────────────────────

      test "update changes title and target fields" do
        patch api_v1_meal_plan_template_path(@template),
              params: { meal_plan: { title: 'Atualizado', target_kcal: 1800 } },
              headers: auth

        assert_response :success
        body = JSON.parse(response.body)
        assert_equal 'Atualizado', body['template']['title']
        assert_in_delta 1800.0, body['template']['target_kcal']
      end

      # ── DELETE destroy ─────────────────────────────────────────────────────────

      test "destroy removes template" do
        delete api_v1_meal_plan_template_path(@template), headers: auth

        assert_response :success
        assert_not MealPlan.exists?(@template.id)
      end

      # ── POST add_day / meals / foods ───────────────────────────────────────────

      test "add_day creates a day on the template" do
        post add_day_api_v1_meal_plan_template_path(@template), headers: auth

        assert_response :created
        body = JSON.parse(response.body)
        assert_equal 1, body['day']['day_number']
        assert @template.meal_plan_days.exists?
      end

      test "add_meal creates meal in template day" do
        day = @template.meal_plan_days.create!(day_number: 1)

        post "/api/v1/meal_plan_templates/#{@template.id}/days/#{day.id}/meals",
             params: { name: 'Café da manhã' },
             headers: auth

        assert_response :created
        assert_equal 'Café da manhã', JSON.parse(response.body)['meal']['name']
      end

      test "add_food attaches food to template meal" do
        day  = @template.meal_plan_days.create!(day_number: 1)
        meal = day.meals.create!(name: 'Almoço', position: 0)

        post "/api/v1/meal_plan_templates/#{@template.id}/days/#{day.id}/meals/#{meal.id}/foods",
             params: { food_id: @food.id, quantity: 150, unit: 'g' },
             headers: auth

        assert_response :created
        body = JSON.parse(response.body)
        assert_equal 'Frango grelhado', body['meal_food']['food_name']
        assert_in_delta 244.5, body['meal_food']['kcal'], 0.5
      end

      # ── POST from_plan ─────────────────────────────────────────────────────────

      test "from_plan copies plan into a new template" do
        plan = @account.meal_plans.create!(contact_id: @contact.id, title: 'Plano original')
        day  = plan.meal_plan_days.create!(day_number: 1, label: 'Segunda')
        meal = day.meals.create!(name: 'Almoço', position: 0)
        meal.meal_foods.create!(food: @food, quantity: 100, unit: 'g', position: 0)

        post from_plan_api_v1_meal_plan_templates_path,
             params: { plan_id: plan.id, title: 'Template copiado', template_category: 'outro' },
             headers: auth

        assert_response :created
        body = JSON.parse(response.body)
        assert_equal 'Template copiado', body['template']['title']

        saved = MealPlan.find(body['template']['id'])
        assert saved.is_template?
        assert_equal 1, saved.meal_plan_days.count
        assert_equal 1, saved.meal_plan_days.first.meals.count
        assert_equal 1, saved.meal_plan_days.first.meals.first.meal_foods.count
      end

      test "from_plan uses plan title when title not given" do
        plan = @account.meal_plans.create!(contact_id: @contact.id, title: 'Plano original')

        post from_plan_api_v1_meal_plan_templates_path,
             params: { plan_id: plan.id },
             headers: auth

        assert_response :created
        assert_equal 'Plano original', JSON.parse(response.body)['template']['title']
      end

      test "from_plan returns 404 for plan from other account" do
        _, other = register_user
        other_plan = ActsAsTenant.with_tenant(other) do
          other.meal_plans.create!(
            contact_id: create_contact(other).id,
            title: 'Plano alheio'
          )
        end

        post from_plan_api_v1_meal_plan_templates_path,
             params: { plan_id: other_plan.id },
             headers: auth

        assert_response :not_found
      end

      # ── POST import_system ─────────────────────────────────────────────────────

      test "import_system creates system templates for the account" do
        post import_system_api_v1_meal_plan_templates_path, headers: auth

        assert_response :success
        body = JSON.parse(response.body)
        assert body['imported'] >= 0
        assert body['templates'].is_a?(Array)
      end

      test "import_system is idempotent — does not duplicate templates" do
        post import_system_api_v1_meal_plan_templates_path, headers: auth
        count_after_first = @account.meal_plans.templates.count

        post import_system_api_v1_meal_plan_templates_path, headers: auth
        body = JSON.parse(response.body)

        assert_equal 0, body['imported']
        assert_equal count_after_first, @account.meal_plans.templates.count
      end

      # ── POST from_template (MealPlansController) ───────────────────────────────

      test "from_template creates a plan from a template" do
        day  = @template.meal_plan_days.create!(day_number: 1, label: 'Segunda')
        meal = day.meals.create!(name: 'Almoço', position: 0)
        meal.meal_foods.create!(food: @food, quantity: 100, unit: 'g', position: 0)

        post from_template_api_v1_contact_meal_plans_path(@contact),
             params: { template_id: @template.id, title: 'Plano copiado' },
             headers: auth

        assert_response :created
        body = JSON.parse(response.body)
        assert_equal 'Plano copiado', body['meal_plan']['title']
        assert_equal 'draft', body['meal_plan']['status']

        plan = MealPlan.find(body['meal_plan']['id'])
        assert_not plan.is_template?
        assert_equal @contact.id, plan.contact_id
        assert_equal 1, plan.meal_plan_days.count
        assert_equal 1, plan.meal_plan_days.first.meals.first.meal_foods.count
      end

      test "from_template uses template title when title not given" do
        post from_template_api_v1_contact_meal_plans_path(@contact),
             params: { template_id: @template.id },
             headers: auth

        assert_response :created
        assert_equal 'Low Carb Base', JSON.parse(response.body)['meal_plan']['title']
      end

      test "from_template returns 404 for unknown template" do
        post from_template_api_v1_contact_meal_plans_path(@contact),
             params: { template_id: 999_999 },
             headers: auth

        assert_response :not_found
      end
    end
  end
end
