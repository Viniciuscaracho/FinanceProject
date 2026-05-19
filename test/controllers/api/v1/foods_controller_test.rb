# frozen_string_literal: true

require 'test_helper'

module Api
  module V1
    class FoodsControllerTest < ActionDispatch::IntegrationTest
      setup do
        @user, @account = register_user
        @auth_token = generate_auth_token(@user)
        ActsAsTenant.current_tenant = @account
      end

      teardown { ActsAsTenant.current_tenant = nil }

      def auth = { 'Authorization' => "Bearer #{@auth_token}" }

      # ── GET index (search) ─────────────────────────────────────────────────────

      test "search returns global and account foods matching query" do
        taco   = Food.create!(name: 'Arroz branco cozido', source: 'taco',   account_id: nil, kcal_per_100g: 128, protein_per_100g: 2.5, carbs_per_100g: 28.1, fat_per_100g: 0.2)
        custom = Food.create!(name: 'Arroz integral caseiro', source: 'custom', account_id: @account.id, kcal_per_100g: 124, protein_per_100g: 2.6, carbs_per_100g: 25.8, fat_per_100g: 1.0)
        _other = Food.create!(name: 'Feijão carioca', source: 'taco', account_id: nil, kcal_per_100g: 76, protein_per_100g: 4.8, carbs_per_100g: 13.6, fat_per_100g: 0.5)

        get api_v1_foods_path, params: { q: 'arroz' }, headers: auth

        assert_response :success
        body = JSON.parse(response.body)
        names = body['foods'].map { |f| f['name'] }
        assert_includes names, taco.name
        assert_includes names, custom.name
        assert_not_includes names, 'Feijão carioca'
      end

      test "search returns empty for query shorter than 2 chars" do
        get api_v1_foods_path, params: { q: 'a' }, headers: auth

        assert_response :success
        body = JSON.parse(response.body)
        assert_empty body['foods']
      end

      test "search does not return custom foods from other accounts" do
        other_user, other_account = register_user
        Food.create!(name: 'Alimento secreto', source: 'custom', account_id: other_account.id, kcal_per_100g: 100, protein_per_100g: 5, carbs_per_100g: 10, fat_per_100g: 2)

        get api_v1_foods_path, params: { q: 'alimento' }, headers: auth

        body  = JSON.parse(response.body)
        names = body['foods'].map { |f| f['name'] }
        assert_not_includes names, 'Alimento secreto'
      end

      # ── POST create ────────────────────────────────────────────────────────────

      test "create saves custom food linked to account" do
        post api_v1_foods_path,
             params: { food: { name: 'Mingau de aveia caseiro', kcal_per_100g: 80,
                                protein_per_100g: 3.0, carbs_per_100g: 14.0, fat_per_100g: 1.5 } },
             headers: auth

        assert_response :created
        body = JSON.parse(response.body)
        assert_equal 'Mingau de aveia caseiro', body['food']['name']
        assert_equal 'custom', body['food']['source']
        saved = Food.find(body['food']['id'])
        assert_equal @account.id, saved.account_id
      end

      test "create returns 422 without name" do
        post api_v1_foods_path,
             params: { food: { kcal_per_100g: 80 } },
             headers: auth

        assert_response :unprocessable_entity
      end

      # ── DELETE destroy ─────────────────────────────────────────────────────────

      test "destroy removes custom food" do
        food = Food.create!(name: 'Deletar', source: 'custom', account_id: @account.id, kcal_per_100g: 50, protein_per_100g: 2, carbs_per_100g: 8, fat_per_100g: 1)

        delete api_v1_food_path(food), headers: auth

        assert_response :success
        assert_not Food.exists?(food.id)
      end
    end
  end
end
