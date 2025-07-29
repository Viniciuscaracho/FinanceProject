# frozen_string_literal: true

# == Schema Information
#
# Table name: domains
#
#  id                  :bigint           not null, primary key
#  description         :text
#  discarded_at        :datetime
#  name                :string           not null
#  transaction_type_cd :integer
#  type                :string           not null
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  account_id          :bigint           not null
#  created_by_id       :bigint
#  updated_by_id       :bigint
#
# Indexes
#
#  index_domains_on_account_id                                   (account_id)
#  index_domains_on_account_id_and_type_and_discarded_at         (account_id,type,discarded_at)
#  index_domains_on_created_by_id                                (created_by_id)
#  index_domains_on_discarded_at                                 (discarded_at)
#  index_domains_on_discarded_at_and_type_and_account_id_and_id  (discarded_at,type,account_id,id)
#  index_domains_on_id_and_type                                  (id,type)
#  index_domains_on_transaction_type_cd                          (transaction_type_cd)
#  index_domains_on_tsv_body                                     (tsv_body) USING gin
#  index_domains_on_type                                         (type)
#  index_domains_on_updated_by_id                                (updated_by_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (created_by_id => users.id)
#  fk_rails_...  (updated_by_id => users.id)
#
require 'test_helper'

class CostCenterTest < ActiveSupport::TestCase
  setup do
    _, @account  = register_user
    # Flipper.enable(:api, @account)

    @cost_center = create_cost_center @account
    @webhook     = create_webhook @account
  end

  test 'should create a cost center' do
    name        = Faker::Lorem.sentence
    description = Faker::Lorem.paragraph
    cost_center = CostCenter.create!(account: @account, name:, description:)

    assert cost_center.persisted?
    assert_equal name, cost_center.name
    assert_equal description, cost_center.description
    assert_equal 2, @account.cost_centers.count
  end

  test 'should update a cost center' do
    name = Faker::Lorem.sentence
    description = Faker::Lorem.paragraph

    @cost_center.update(name:, description:)
    assert @cost_center.persisted?
    assert_equal name, @cost_center.name
    assert_equal description, @cost_center.description
  end

  test 'should discard a cost center' do
    @cost_center.discard!
    assert @cost_center.discarded?
    assert_equal 0, @account.cost_centers.count
  end

  test 'should find a cost center by id' do
    cost_center = CostCenter.find(@cost_center.id)
    assert_equal @cost_center.name, cost_center.name
    assert_equal @cost_center.description, cost_center.description
  end

  test 'should not create an invalid cost center' do
    cost_center = CostCenter.create(account: @account, name: nil, description: Faker::Lorem.paragraph)
    assert_not cost_center.persisted?
    assert_not cost_center.valid?
    assert_equal ['não pode ficar em branco'], cost_center.errors[:name]
  end

  test 'should deliver webhook when cost center is created' do
    assert_enqueued_with(job: WebhookDeliverJob, queue: 'webhooks') do
      create_cost_center(@account)
    end
  end

  test 'should deliver webhook when cost center is updated' do
    assert_enqueued_with(job: WebhookDeliverJob, queue: 'webhooks') do
      @cost_center.update(name: 'test')
    end
  end

  test 'should deliver webhook when cost center is deleted' do
    assert_enqueued_with(job: WebhookDeliverJob, queue: 'webhooks') do
      @cost_center.discard
    end
  end

end
