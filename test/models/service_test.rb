# frozen_string_literal: true

# == Schema Information
#
# Table name: offers
#
#  id                  :bigint           not null, primary key
#  cost_price_cents    :bigint           default(0), not null
#  currency            :string           default("BRL"), not null
#  data                :jsonb            not null
#  description         :text
#  discarded_at        :datetime
#  enabled             :string           default("t"), not null
#  internal_code       :string
#  meeting_url         :string
#  metadata            :jsonb            not null
#  modality            :integer          default(0), not null
#  name                :string           not null
#  offer_type_cd       :integer
#  selling_price_cents :bigint           default(0), not null
#  type                :string           not null
#  unit                :string
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  account_id          :bigint           not null
#
# Indexes
#
#  index_offers_on_account_id                            (account_id)
#  index_offers_on_account_id_and_discarded_at           (account_id,discarded_at)
#  index_offers_on_account_id_and_enabled                (account_id,enabled)
#  index_offers_on_account_id_and_internal_code          (account_id,internal_code)
#  index_offers_on_account_id_and_type                   (account_id,type)
#  index_offers_on_discarded_at_and_type_and_account_id  (discarded_at,type,account_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
require 'test_helper'

class ServiceTest < ActiveSupport::TestCase
  setup do
    @user, @account = register_user
    @service = create_service @account
    @bank_account = create_bank_account(@account)
  end

  test 'should create service' do
    assert @service.valid?
    assert_difference('Service.count') do
      service = create_service @account
      service.save
    end
  end

  test 'should not create service without name' do
    @service.name = nil
    assert_not @service.valid?
    assert @service.errors[:name].any?
  end

  test 'should not create service with selling_price_cents less than 0' do
    @service.selling_price_cents = -1
    assert_not @service.valid?
    assert @service.errors[:selling_price_cents].any?
  end

  test 'should not create service with excessive selling price' do
    @service.selling_price_cents = 1_000_000_000_000
    assert_not @service.valid?
    assert @service.errors[:selling_price_cents].any?
  end

  test 'should not create service with negative cost price' do
    @service.cost_price_cents = -1
    assert_not @service.valid?
    assert @service.errors[:cost_price_cents].any?
  end

  test 'should not create service with excessive cost price' do
    @service.cost_price_cents = 1_000_000_000_000
    assert_not @service.valid?
    assert @service.errors[:cost_price_cents].any?
  end

  test 'should create and destroy service' do
    assert_difference('Service.count', 1) do
      service = create_service @account
      service.save
    end

    assert_difference('Service.count', -1) do
      @service.destroy
    end
  end

  test 'should update service' do
    @service.save
    new_name = 'Updated Service Name'
    @service.update(name: new_name)
    assert_equal new_name, @service.reload.name
  end

  test 'should not update service with invalid data' do
    @service.save
    assert_not @service.update(name: nil), 'Expected update to fail with invalid data'
    assert @service.errors[:name].any?
  end

  test 'should restrict deletion if there are associated transactions' do
    @service.save
    transaction = create_transaction(@account, @bank_account)
    transaction.update(service: @service)
    assert_no_difference('Service.count') do
      @service.destroy
    end
    assert @service.errors[:base].any?
  end

  # test 'should handle flipper errors gracefully' do
  #   Flipper.stubs(:enabled?).raises(StandardError, 'Flipper error')
  #   assert_nothing_raised do
  #     @service.valid?
  #   end
  # end
end
