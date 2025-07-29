# frozen_string_literal: true

require 'application_system_test_case'

class TransactionsTest < ApplicationSystemTestCase
  # setup do
  #   sign_in users(:user_one)
  # end
  #
  # test 'visiting contacts' do
  #   visit contacts_url
  # end
  #
  # test 'creating other contact' do
  #   visit contacts_url
  #   click_on class: 'btn-circle btn-circle--primary'
  #   fill_in id:'contact_name', with: 'Eaí meu chapa, tudo bem?'
  #   fill_in id:'contact_document_1', with: '15.469.279/0001-24'
  #   fill_in id:'contact_document_2', with: '15.469.279/0001-24'
  #   fill_in id:'contact_phone_number', with: '49998414482'
  #   fill_in id:'contact_email', with: 'loremipsum@gmail.com'
  #   select 'Outro', :from => 'contact_contact_type'
  #   click_on 'Criar Contato'
  # end
  #
  # test 'creating client contact' do
  #   visit contacts_url
  #   click_on class: 'btn-circle btn-circle--primary'
  #   fill_in id:'contact_name', with: 'Eaí meu chapa, tudo bem?'
  #   fill_in id:'contact_document_1', with: '15.469.279/0001-24'
  #   fill_in id:'contact_document_2', with: '15.469.279/0001-24'
  #   fill_in id:'contact_phone_number', with: '49998414482'
  #   fill_in id:'contact_email', with: 'loremipsum@gmail.com'
  #   select 'Cliente', :from => 'contact_contact_type'
  #   click_on 'Criar Contato'
  # end
  #
  # test 'creating colaborator contact' do
  #   visit contacts_url
  #   click_on class: 'btn-circle btn-circle--primary'
  #   fill_in id:'contact_name', with: 'Eaí meu chapa, tudo bem?'
  #   fill_in id:'contact_document_1', with: '15.469.279/0001-24'
  #   fill_in id:'contact_document_2', with: '15.469.279/0001-24'
  #   fill_in id:'contact_phone_number', with: '49998414482'
  #   fill_in id:'contact_email', with: 'loremipsum@gmail.com'
  #   select 'Colaborador', :from => 'contact_contact_type'
  #   click_on 'Criar Contato'
  # end
  #
  # test 'creating partner contact' do
  #   visit contacts_url
  #   click_on class: 'btn-circle btn-circle--primary'
  #   fill_in id:'contact_name', with: 'Eaí meu chapa, tudo bem?'
  #   fill_in id:'contact_document_1', with: '15.469.279/0001-24'
  #   fill_in id:'contact_document_2', with: '15.469.279/0001-24'
  #   fill_in id:'contact_phone_number', with: '49998414482'
  #   fill_in id:'contact_email', with: 'loremipsum@gmail.com'
  #   select 'Fornecedor', :from => 'contact_contact_type'
  #   click_on 'Criar Contato'
  # end
  #
  # test 'creating fisical person contact' do
  #   visit contacts_url
  #   click_on class: 'btn-circle btn-circle--primary'
  #   fill_in id:'contact_name', with: 'Eaí meu chapa, tudo bem?'
  #   fill_in id:'contact_document_1', with: '15.469.279/0001-24'
  #   fill_in id:'contact_document_2', with: '15.469.279/0001-24'
  #   fill_in id:'contact_phone_number', with: '49998414482'
  #   fill_in id:'contact_email', with: 'loremipsum@gmail.com'
  #   select 'Pessoa física', :from => 'contact_person_type'
  #   click_on 'Criar Contato'
  # end
  #
  # test 'creating juridic person contact' do
  #   visit contacts_url
  #   click_on class: 'btn-circle btn-circle--primary'
  #   fill_in id:'contact_name', with: 'Eaí meu chapa, tudo bem?'
  #   fill_in id:'contact_document_1', with: '15.469.279/0001-24'
  #   fill_in id:'contact_document_2', with: '15.469.279/0001-24'
  #   fill_in id:'contact_phone_number', with: '49998414482'
  #   fill_in id:'contact_email', with: 'loremipsum@gmail.com'
  #   select 'Pessoa jurídica', :from => 'contact_person_type'
  #   click_on 'Criar Contato'
  # end
  #
  # test 'changing contact profile picture' do
  #   visit contacts_url
  #   click_on class: 'btn-circle btn-circle--primary'
  #   fill_in id:'contact_name', with: 'Eaí meu chapa, tudo bem?'
  #   fill_in id:'contact_document_1', with: '15.469.279/0001-24'
  #   fill_in id:'contact_document_2', with: '15.469.279/0001-24'
  #   fill_in id:'contact_phone_number', with: '49998414482'
  #   fill_in id:'contact_email', with: 'loremipsum@gmail.com'
  #   select 'Pessoa jurídica', :from => 'contact_person_type'
  #   attach_file "contact_avatar", file_fixture("profile.jpg")
  #   sleep 0.2
  #   click_on 'Criar Contato'
  # end
end