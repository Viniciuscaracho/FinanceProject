# frozen_string_literal: true

# == Schema Information
#
# Table name: patient_goals
#
#  id               :bigint           not null, primary key
#  current_value    :decimal(10, 2)
#  deadline         :date
#  notes            :text
#  progress_history :jsonb            not null
#  status           :integer          default(0), not null
#  target_value     :decimal(10, 2)
#  title            :string           not null
#  unit             :string
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  account_id       :bigint           not null
#  contact_id       :bigint           not null
#
# Indexes
#
#  index_patient_goals_on_account_id                 (account_id)
#  index_patient_goals_on_account_id_and_contact_id  (account_id,contact_id)
#  index_patient_goals_on_contact_id                 (contact_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (contact_id => people.id)
#
require 'test_helper'

class PatientGoalTest < ActiveSupport::TestCase
  setup do
    _, @account = register_user
    @contact = create_contact(@account)
    ActsAsTenant.current_tenant = @account
  end

  teardown { ActsAsTenant.current_tenant = nil }

  test "should be valid with title and contact" do
    goal = @account.patient_goals.build(contact_id: @contact.id, title: 'Emagrecer 5kg')
    assert goal.valid?
  end

  test "should require title" do
    goal = @account.patient_goals.build(contact_id: @contact.id, title: '')
    assert_not goal.valid?
    assert goal.errors[:title].any?
  end

  test "should require contact_id" do
    goal = @account.patient_goals.build(title: 'Objetivo')
    assert_not goal.valid?
  end

  test "should default to active status" do
    goal = @account.patient_goals.create!(contact_id: @contact.id, title: 'Meta')
    assert_equal :active, goal.status
  end

  test "add_progress records value and updates current_value" do
    goal = @account.patient_goals.create!(
      contact_id:    @contact.id,
      title:         'Perder peso',
      unit:          'kg',
      target_value:  65.0,
      current_value: 72.0
    )

    result = goal.add_progress(70.0, 'Primeira medição')
    assert result
    goal.reload
    assert_equal 70.0, goal.current_value.to_f
    assert_equal 1, goal.progress_history.length
    assert_equal 70.0, goal.progress_history.first['value']
    assert_equal 'Primeira medição', goal.progress_history.first['note']
  end

  test "add_progress appends to history" do
    goal = @account.patient_goals.create!(contact_id: @contact.id, title: 'Meta')
    goal.add_progress(72.0)
    goal.add_progress(70.5)
    goal.reload
    assert_equal 2, goal.progress_history.length
    assert_equal 70.5, goal.current_value.to_f
  end

  test "active scope" do
    active    = @account.patient_goals.create!(contact_id: @contact.id, title: 'A', status: :active)
    completed = @account.patient_goals.create!(contact_id: @contact.id, title: 'B', status: :completed)
    assert_includes @account.patient_goals.active, active
    assert_not_includes @account.patient_goals.active, completed
  end

  test "for_contact scope" do
    other_contact = create_contact(@account)
    goal1 = @account.patient_goals.create!(contact_id: @contact.id, title: 'G1')
    goal2 = @account.patient_goals.create!(contact_id: other_contact.id, title: 'G2')
    scope = @account.patient_goals.for_contact(@contact.id)
    assert_includes scope, goal1
    assert_not_includes scope, goal2
  end

  test "status enum values" do
    goal = @account.patient_goals.create!(contact_id: @contact.id, title: 'M', status: :completed)
    assert_equal :completed, goal.status
    goal.update!(status: :abandoned)
    assert_equal :abandoned, goal.status
  end
end
