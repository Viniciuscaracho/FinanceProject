# frozen_string_literal: true

require 'application_system_test_case'

class CategoriesTest < ApplicationSystemTestCase
  setup do
    @user, @account = register_user
    @category = create_category @account
    sign_in @user
  end

  test 'should navigate all tabs' do
    visit categories_url
    click_on 'Todos'
    click_on 'Despesas fixas'
    click_on 'Despesas variáveis'
    click_on 'Impostos'
    click_on 'Pessoas'
    click_on 'Recebimentos'
  end

  test 'should create a new category' do
    visit categories_url
    click_on 'Todos'
    click_on 'new_category'
    fill_in id: 'category_name', with: Faker::Lorem.sentence
    fill_in id: 'category_description', with: Faker::Lorem.paragraph
    click_on 'Criar Categoria'
  end

  test 'should create a new category of revenue' do
    visit categories_url
    click_on 'Recebimentos'
    click_on 'new_category'
    fill_in id: 'category_name', with: Faker::Lorem.sentence
    fill_in id: 'category_description', with: Faker::Lorem.paragraph
    click_on 'Criar Categoria'
  end

  test 'should create a new category of fixed expense' do
    visit categories_url
    click_on 'Despesas fixas'
    click_on 'new_category'
    fill_in id: 'category_name', with: Faker::Lorem.sentence
    fill_in id: 'category_description', with: Faker::Lorem.paragraph
    click_on 'Criar Categoria'
  end

  test 'should archive a category' do
    visit categories_url
    find("#category_#{@category.id}").hover
    find("#category_#{@category.id} #destroy_#{dom_id(@category)}").click
    click_on 'Confirmar'
    find('#dismiss_flash_message').click
  end

  test 'should edit a category' do
    visit categories_url
    find("#category_#{@category.id}").hover
    find("#category_#{@category.id} #edit_#{dom_id(@category)}").click
    fill_in id: 'category_name', with: Faker::Lorem.sentence
    fill_in id: 'category_description', with: Faker::Lorem.paragraph
    click_on 'Atualizar Categoria'
    find('#dismiss_flash_message').click
  end

  test 'should not update a category when name is blank then fix and save it' do
    visit categories_url
    find("#category_#{@category.id}").hover
    find("#category_#{@category.id} #edit_#{dom_id(@category)}").click
    fill_in id: 'category_name', with: ''
    fill_in id: 'category_description', with: Faker::Lorem.paragraph
    click_on 'Atualizar Categoria'
    assert_text 'Nome não pode ficar em branco'
    fill_in id: 'category_name', with: Faker::Lorem.sentence
    click_on 'Atualizar Categoria'
    find('#dismiss_flash_message').click
  end

end
