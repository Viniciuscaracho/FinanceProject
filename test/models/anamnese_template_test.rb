# frozen_string_literal: true

# == Schema Information
#
# Table name: anamnese_templates
#
#  id          :bigint           not null, primary key
#  active      :boolean          default(TRUE), not null
#  description :text
#  fields      :jsonb            not null
#  name        :string           not null
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  account_id  :bigint           not null
#
# Indexes
#
#  index_anamnese_templates_on_account_id  (account_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
require 'test_helper'

class AnamneseTemplateTest < ActiveSupport::TestCase
  setup do
    _, @account = register_user
    ActsAsTenant.current_tenant = @account
  end

  teardown do
    ActsAsTenant.current_tenant = nil
  end

  test "should be valid with name" do
    tpl = @account.anamnese_templates.build(name: 'Anamnese Inicial', fields: [])
    assert tpl.valid?
  end

  test "should require name" do
    tpl = @account.anamnese_templates.build(name: '', fields: [])
    assert_not tpl.valid?
    assert tpl.errors[:name].any?
  end

  test "should reject name over 200 chars" do
    tpl = @account.anamnese_templates.build(name: 'A' * 201, fields: [])
    assert_not tpl.valid?
  end

  test "should default to active" do
    tpl = @account.anamnese_templates.create!(name: 'Test', fields: [])
    assert tpl.active?
  end

  test "should store fields as jsonb" do
    fields = [
      { 'id' => SecureRandom.uuid, 'label' => 'Queixa principal', 'type' => 'textarea', 'required' => true, 'options' => [] },
      { 'id' => SecureRandom.uuid, 'label' => 'Peso (kg)', 'type' => 'number', 'required' => false, 'options' => [] },
    ]
    tpl = @account.anamnese_templates.create!(name: 'Nutricional', fields: fields)
    tpl.reload
    assert_equal 2, tpl.fields.length
    assert_equal 'Queixa principal', tpl.fields.first['label']
  end

  test "active scope excludes inactive templates" do
    active  = @account.anamnese_templates.create!(name: 'Ativo',   fields: [], active: true)
    inactive = @account.anamnese_templates.create!(name: 'Inativo', fields: [], active: false)
    scope = @account.anamnese_templates.active
    assert_includes scope, active
    assert_not_includes scope, inactive
  end

  test "recent scope orders by created_at desc" do
    first  = @account.anamnese_templates.create!(name: 'Primeiro', fields: [], created_at: 2.days.ago)
    second = @account.anamnese_templates.create!(name: 'Segundo',  fields: [])
    assert_equal second.id, @account.anamnese_templates.recent.first.id
  end

  test "is scoped to account" do
    _, other_account = register_user
    ActsAsTenant.current_tenant = other_account
    other_tpl = other_account.anamnese_templates.create!(name: 'Outro', fields: [])

    ActsAsTenant.current_tenant = @account
    assert_not_includes @account.anamnese_templates, other_tpl
  end
end
