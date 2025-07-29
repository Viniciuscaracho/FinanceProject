# frozen_string_literal: true

require 'test_helper'

module Categories
  class CreateTest < ActiveSupport::TestCase
    setup do
      _, @account = register_user
      @category = create_category @account
      @category_params = {
        name: Faker::Lorem.sentence,
        description: Faker::Lorem.paragraph
      }
    end

    test 'should create a category' do
      result = Categories::Create.call(account: @account, category_params: @category_params)

      assert result.success?
      assert_equal 0, result.category.errors.count
      assert_equal @category_params[:name], result.category.name
      assert_equal @category_params[:description], result.category.description
      assert_equal 2, @account.categories.count
    end

    test 'should update a category' do
      name = Faker::Lorem.sentence
      description = Faker::Lorem.paragraph

      @category.update(name:, description:)

      assert @category.persisted?
      assert_equal 0, @category.errors.count
      assert_equal name, @category.name
      assert_equal description, @category.description
    end

    test 'should discard a category' do
      @category.discard!

      assert @category.discarded?
      assert_equal 0, @account.categories.count
    end

    test 'should find a category by id' do
      category = Category.find(@category.id)
      assert_equal @category.name, category.name
      assert_equal @category.description, category.description
    end

    test 'should not create an invalid category' do
      category = Category.create(
        account: @account,
        name: nil,
        description: Faker::Lorem.paragraph
      )

      assert_not category.persisted?
      assert_not category.valid?
      assert_equal 1, category.errors.count
      assert_equal ['não pode ficar em branco'], category.errors[:name]
    end
  end
end

