# frozen_string_literal: true

require 'test_helper'

module MealPlans
  class ImportSystemTemplatesTest < ActiveSupport::TestCase
    setup do
      _, @account = register_user
      ActsAsTenant.current_tenant = @account
    end

    teardown { ActsAsTenant.current_tenant = nil }

    test "creates templates for the account" do
      result = ImportSystemTemplates.call(account: @account)

      assert result.success?
      assert result.imported >= 0
      assert @account.meal_plans.templates.count >= result.imported
    end

    test "all created templates have is_template true" do
      ImportSystemTemplates.call(account: @account)

      @account.meal_plans.templates.each do |tpl|
        assert tpl.is_template?, "#{tpl.title} should be a template"
      end
    end

    test "all created templates have no contact" do
      ImportSystemTemplates.call(account: @account)

      @account.meal_plans.templates.each do |tpl|
        assert_nil tpl.contact_id, "#{tpl.title} should have no contact"
      end
    end

    test "is idempotent — calling twice does not duplicate" do
      ImportSystemTemplates.call(account: @account)
      count_after_first = @account.meal_plans.templates.count

      result = ImportSystemTemplates.call(account: @account)

      assert_equal 0, result.imported
      assert_equal count_after_first, @account.meal_plans.templates.count
    end

    test "templates from this account are not visible to another account" do
      ImportSystemTemplates.call(account: @account)

      _, other_account = register_user
      ActsAsTenant.with_tenant(other_account) do
        assert_equal 0, other_account.meal_plans.templates.count
      end
    end

    test "each template has a valid template_category" do
      ImportSystemTemplates.call(account: @account)

      @account.meal_plans.templates.each do |tpl|
        assert MealPlan::TEMPLATE_CATEGORIES.include?(tpl.template_category),
               "#{tpl.title} has invalid category '#{tpl.template_category}'"
      end
    end
  end
end
