# frozen_string_literal: true

# == Schema Information
#
# Table name: meal_plans
#
#  id                :bigint           not null, primary key
#  description       :text
#  end_date          :date
#  is_template       :boolean          default(FALSE), not null
#  notes             :text
#  public_token      :string           not null
#  start_date        :date
#  status            :integer          default(0), not null
#  template_category :string
#  title             :string           not null
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  account_id        :bigint           not null
#  contact_id        :bigint
#
# Indexes
#
#  index_meal_plans_on_account_id                 (account_id)
#  index_meal_plans_on_account_id_and_contact_id  (account_id,contact_id)
#  index_meal_plans_on_contact_id                 (contact_id)
#  index_meal_plans_on_is_template                (is_template)
#  index_meal_plans_on_public_token               (public_token) UNIQUE
#
require 'test_helper'

class MealPlanTest < ActiveSupport::TestCase
  setup do
    _, @account = register_user
    @contact = create_contact(@account)
    ActsAsTenant.current_tenant = @account
  end

  teardown { ActsAsTenant.current_tenant = nil }

  test "valid with required fields" do
    plan = @account.meal_plans.build(contact_id: @contact.id, title: 'Plano verão')
    assert plan.valid?
  end

  test "requires title" do
    plan = @account.meal_plans.build(contact_id: @contact.id, title: '')
    assert_not plan.valid?
    assert plan.errors[:title].any?
  end

  test "requires contact_id" do
    plan = @account.meal_plans.build(title: 'Plano')
    assert_not plan.valid?
  end

  test "generates public_token on create" do
    plan = @account.meal_plans.create!(contact_id: @contact.id, title: 'Plano')
    assert plan.public_token.present?
    assert plan.public_token.length >= 16
  end

  test "public_token is unique" do
    plan1 = @account.meal_plans.create!(contact_id: @contact.id, title: 'P1')
    plan2 = @account.meal_plans.create!(contact_id: @contact.id, title: 'P2')
    assert_not_equal plan1.public_token, plan2.public_token
  end

  test "defaults to draft status" do
    plan = @account.meal_plans.create!(contact_id: @contact.id, title: 'Plano')
    assert_equal :draft, plan.status
  end

  test "can be activated" do
    plan = @account.meal_plans.create!(contact_id: @contact.id, title: 'Plano')
    plan.update!(status: :active)
    assert_equal :active, plan.status
  end

  test "for_contact scope" do
    other_contact = create_contact(@account)
    plan1 = @account.meal_plans.create!(contact_id: @contact.id, title: 'P1')
    plan2 = @account.meal_plans.create!(contact_id: other_contact.id, title: 'P2')
    scoped = @account.meal_plans.for_contact(@contact.id)
    assert_includes scoped, plan1
    assert_not_includes scoped, plan2
  end

  test "total_days counts meal_plan_days" do
    plan = @account.meal_plans.create!(contact_id: @contact.id, title: 'Plano')
    assert_equal 0, plan.total_days
    plan.meal_plan_days.create!(day_number: 1)
    plan.meal_plan_days.create!(day_number: 2)
    assert_equal 2, plan.total_days
  end

  test "destroying plan cascades to days and meals" do
    plan = @account.meal_plans.create!(contact_id: @contact.id, title: 'Plano')
    day  = plan.meal_plan_days.create!(day_number: 1)
    meal = day.meals.create!(name: 'Almoço', position: 0)
    plan.destroy
    assert_not MealPlanDay.exists?(day.id)
    assert_not Meal.exists?(meal.id)
  end
end
