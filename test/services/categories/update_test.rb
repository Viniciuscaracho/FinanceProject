# frozen_string_literal: true

require 'test_helper'

module Categories
  class UpdateTest < ActiveSupport::TestCase
    setup do
      _, @account = register_user
      @category = create_category @account
      @category_params = {
        name: Faker::Lorem.sentence,
        description: Faker::Lorem.paragraph
      }
    end

    test 'should update a category with service' do
      result = Categories::Update.call(category: @category, category_params: @category_params)
      assert_enqueued_jobs 1, only: UpdateTransactionsTsvBodyJob
      perform_enqueued_jobs only: UpdateTransactionsTsvBodyJob

      @category.reload

      assert result.success?
      assert_equal @category, result.category
      assert_equal @category_params[:name], @category.name
      assert_equal @category_params[:description], @category.description
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

