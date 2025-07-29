# frozen_string_literal: true

require 'application_system_test_case'

class TransactionsTest < ApplicationSystemTestCase
  # setup do
  #   sign_in users(:user_one)
  #   Stripe.api_key = Rails.application.credentials.dig(:stripe, :private_key)
  # end
  #
  # test 'visiting profile settings' do
  #   visit imports_url
  #   click_on users(:user_one).first_name
  #   click_on 'Configurações de Procfy'
  # end
  #
  # test 'editing profile infos' do
  #   visit imports_url
  #   click_on users(:user_one).first_name
  #   click_on 'Configurações de Procfy'
  #   fill_in id: 'account_company_attributes_name', with: 'Lorem ipsum'
  #   fill_in id: 'account_company_attributes_document_1', with: 'Lorem ipsum'
  #   fill_in id: 'account_company_attributes_email', with: 'loremipsum@gmail.com'
  #   fill_in id: 'account_company_attributes_phone_number', with: 'loremipsum@gmail.com'
  #   click_on 'Atualizar Conta'
  # end
  #
  # test 'editing observations' do
  #   visit imports_url
  #   click_on users(:user_one).first_name
  #   click_on 'Configurações de Procfy'
  #   fill_in id: 'account_company_attributes_description', with: 'Lorem ipsumLorem ipsumLorem ipsumLorem ipsumLorem ipsumLorem ipsumLorem ipsumLorem ipsumLorem ipsumLorem ipsumLorem ipsumLorem ipsumLorem ipsumLorem ipsumLorem ipsumLorem ipsum'
  #   click_on 'Atualizar Conta'
  # end
  #
  # test 'changing profile picture' do
  #   visit imports_url
  #   click_on users(:user_one).first_name
  #   click_on 'Configurações de Procfy'
  #   attach_file "account_company_attributes_avatar", file_fixture("profile.jpg")
  #   sleep 0.2
  #   click_on 'Atualizar Conta'
  # end
end