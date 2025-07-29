# frozen_string_literal: true

require 'test_helper'

module CostCenters
  class DiscardTest < ActiveSupport::TestCase
    setup do
      _, @account = register_user
      @cost_center = create_cost_center @account
    end

    test 'should discard a cost center with service' do
      result = CostCenters::Discard.call(cost_center: @cost_center)

      assert result.success?
      assert result.cost_center.discarded?
      assert_equal 0, @account.cost_centers.count
    end

    test 'should update a cost_center' do
      name = Faker::Lorem.sentence
      description = Faker::Lorem.paragraph

      @cost_center.update(name:, description:)

      assert @cost_center.persisted?
      assert_equal 0, @cost_center.errors.count
      assert_equal name, @cost_center.name
      assert_equal description, @cost_center.description
    end

    test 'should discard a cost_center' do
      @cost_center.discard!

      assert @cost_center.discarded?
      assert_equal 0, @account.cost_centers.count
    end

    test 'should find a cost_center by id' do
      cost_center = CostCenter.find(@cost_center.id)
      assert_equal @cost_center.name, cost_center.name
      assert_equal @cost_center.description, cost_center.description
    end

    test 'should not create an invalid cost_center' do
      cost_center = CostCenter.create(
        account: @account,
        name: nil,
        description: Faker::Lorem.paragraph
      )

      assert_not cost_center.persisted?
      assert_not cost_center.valid?
      assert_equal 1, cost_center.errors.count
      assert_equal ['não pode ficar em branco'], cost_center.errors[:name]
    end
  end
end

