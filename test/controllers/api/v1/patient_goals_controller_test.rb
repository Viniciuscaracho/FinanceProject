# frozen_string_literal: true

require 'test_helper'

module Api
  module V1
    class PatientGoalsControllerTest < ActionDispatch::IntegrationTest
      setup do
        @user, @account = register_user
        @auth_token = generate_auth_token(@user)
        @contact = create_contact(@account)
        ActsAsTenant.current_tenant = @account
      end

      teardown { ActsAsTenant.current_tenant = nil }

      # ── GET index ─────────────────────────────────────────────────────────────

      test "index returns goals for contact" do
        goal = @account.patient_goals.create!(contact_id: @contact.id, title: 'Emagrecer 5kg', unit: 'kg', target_value: 65, current_value: 70)

        get api_v1_contact_patient_goals_path(@contact),
            headers: { 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :success
        body = JSON.parse(response.body)
        ids = body['goals'].map { |g| g['id'] }
        assert_includes ids, goal.id
      end

      test "index does not return goals from other contacts" do
        other_contact = create_contact(@account)
        goal_mine = @account.patient_goals.create!(contact_id: @contact.id, title: 'Minha meta')
        goal_other = @account.patient_goals.create!(contact_id: other_contact.id, title: 'Outra meta')

        get api_v1_contact_patient_goals_path(@contact),
            headers: { 'Authorization' => "Bearer #{@auth_token}" }

        body = JSON.parse(response.body)
        ids = body['goals'].map { |g| g['id'] }
        assert_includes ids, goal_mine.id
        assert_not_includes ids, goal_other.id
      end

      # ── POST create ───────────────────────────────────────────────────────────

      test "create saves a new goal" do
        post api_v1_contact_patient_goals_path(@contact),
             params: { patient_goal: { title: 'Perder peso', unit: 'kg', target_value: 65, current_value: 72 } },
             headers: { 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :created
        body = JSON.parse(response.body)
        assert_equal 'Perder peso', body['goal']['title']
        assert_equal 65.0, body['goal']['target_value'].to_f
        assert_equal @contact.id, body['goal']['contact_id']
      end

      test "create returns 422 without title" do
        post api_v1_contact_patient_goals_path(@contact),
             params: { patient_goal: { unit: 'kg' } },
             headers: { 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :unprocessable_entity
        body = JSON.parse(response.body)
        assert body['errors'].any?
      end

      # ── PATCH update ──────────────────────────────────────────────────────────

      test "update changes goal fields" do
        goal = @account.patient_goals.create!(contact_id: @contact.id, title: 'Meta antiga')

        patch api_v1_contact_patient_goal_path(@contact, goal),
              params: { patient_goal: { title: 'Meta nova', status: 'completed' } },
              headers: { 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :success
        goal.reload
        assert_equal 'Meta nova', goal.title
        assert_equal :completed, goal.status
      end

      test "update cannot reach goal from another account" do
        _, other_account = register_user
        ActsAsTenant.with_tenant(other_account) do
          other_contact = create_contact(other_account)
          @other_goal = other_account.patient_goals.create!(contact_id: other_contact.id, title: 'Alheia')
        end

        patch api_v1_contact_patient_goal_path(@contact, @other_goal),
              params: { patient_goal: { title: 'Hack' } },
              headers: { 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :not_found
      end

      # ── DELETE destroy ────────────────────────────────────────────────────────

      test "destroy removes goal" do
        goal = @account.patient_goals.create!(contact_id: @contact.id, title: 'A remover')

        delete api_v1_contact_patient_goal_path(@contact, goal),
               headers: { 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :success
        assert_not PatientGoal.exists?(goal.id)
      end

      # ── POST add_progress ─────────────────────────────────────────────────────

      test "add_progress updates current_value and appends to history" do
        goal = @account.patient_goals.create!(
          contact_id: @contact.id, title: 'Peso', unit: 'kg',
          target_value: 65, current_value: 72, progress_history: []
        )

        post add_progress_api_v1_contact_patient_goal_path(@contact, goal),
             params: { value: 70.5, note: 'Após dieta', date: '2026-05-10' },
             headers: { 'Authorization' => "Bearer #{@auth_token}" }

        assert_response :success
        body = JSON.parse(response.body)
        assert_equal 70.5, body['goal']['current_value'].to_f
        history = body['goal']['progress_history']
        assert_equal 1, history.length
        assert_equal 70.5, history.first['value']
        assert_equal 'Após dieta', history.first['note']
        assert_equal '2026-05-10', history.first['date']
      end

      test "add_progress appends multiple entries" do
        goal = @account.patient_goals.create!(
          contact_id: @contact.id, title: 'Peso', unit: 'kg',
          target_value: 65, current_value: 72, progress_history: []
        )
        goal.add_progress(71.0, 'Semana 1')

        post add_progress_api_v1_contact_patient_goal_path(@contact, goal),
             params: { value: 70.0, note: 'Semana 2' },
             headers: { 'Authorization' => "Bearer #{@auth_token}" }

        body = JSON.parse(response.body)
        assert_equal 2, body['goal']['progress_history'].length
        assert_equal 70.0, body['goal']['current_value'].to_f
      end
    end
  end
end
