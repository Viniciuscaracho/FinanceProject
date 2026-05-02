# frozen_string_literal: true

# == Schema Information
#
# Table name: appointment_links
#
#  id                 :bigint           not null, primary key
#  active             :boolean          default(TRUE), not null
#  description        :text
#  enable_google_meet :boolean          default(FALSE)
#  name               :string
#  settings           :jsonb
#  token              :string           not null
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  account_id         :bigint           not null
#  account_user_id    :bigint
#  service_id         :bigint
#
# Indexes
#
#  index_appointment_links_on_account_id        (account_id)
#  index_appointment_links_on_account_user_id   (account_user_id)
#  index_appointment_links_on_active            (active)
#  index_appointment_links_on_service_id        (service_id)
#  index_appointment_links_on_token             (token) UNIQUE
#  index_appointment_links_on_token_and_active  (token,active) WHERE (active = true)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (account_user_id => account_users.id)
#  fk_rails_...  (service_id => offers.id)
#
require 'test_helper'

class AppointmentLinkTest < ActiveSupport::TestCase
  setup do
    _, @account = register_user
    @service = create_service(@account)
    @account_user = @account.account_users.first
  end

  test "should generate token automatically on create" do
    link = @account.appointment_links.create!(
      name: 'Link de Agendamento',
      service: @service,
      account_user: @account_user
    )
    
    assert_not_nil link.token
    assert_equal 32, link.token.length
  end

  test "should not allow duplicate tokens" do
    token = SecureRandom.alphanumeric(32)
    
    link1 = @account.appointment_links.create!(
      name: 'Link 1',
      token: token
    )
    
    link2 = @account.appointment_links.new(
      name: 'Link 2',
      token: token
    )
    
    assert_not link2.valid?
    assert_includes link2.errors[:token], 'has already been taken'
  end

  test "should require name" do
    link = @account.appointment_links.new(
      service: @service
    )
    
    assert_not link.valid?
    assert_includes link.errors[:name], "can't be blank"
  end

  test "should be active by default" do
    link = @account.appointment_links.create!(
      name: 'Link de Agendamento'
    )
    
    assert link.active?
  end

  test "should generate public_url correctly" do
    link = @account.appointment_links.create!(
      name: 'Link de Agendamento',
      token: 'test_token_123'
    )
    
    url = link.public_url
    assert_includes url, link.token
    assert_includes url, '/agendar/'
  end

  test "should use FRONTEND_URL if available" do
    ENV['FRONTEND_URL'] = 'https://app.example.com'
    
    link = @account.appointment_links.create!(
      name: 'Link de Agendamento',
      token: 'test_token_123'
    )
    
    url = link.public_url
    assert_includes url, 'https://app.example.com'
    
    ENV.delete('FRONTEND_URL')
  end

  test "should scope active links" do
    active_link = @account.appointment_links.create!(
      name: 'Link Ativo',
      active: true
    )
    
    inactive_link = @account.appointment_links.create!(
      name: 'Link Inativo',
      active: false
    )
    
    active_links = @account.appointment_links.active
    assert_includes active_links, active_link
    assert_not_includes active_links, inactive_link
  end

  test "should use token as param" do
    link = @account.appointment_links.create!(
      name: 'Link de Agendamento',
      token: 'custom_token_123'
    )
    
    assert_equal 'custom_token_123', link.to_param
  end

  test "should allow optional service" do
    link = @account.appointment_links.create!(
      name: 'Link sem serviço específico'
    )
    
    assert_nil link.service
    assert link.valid?
  end

  test "should allow optional account_user" do
    link = @account.appointment_links.create!(
      name: 'Link sem profissional específico'
    )
    
    assert_nil link.account_user
    assert link.valid?
  end
end

