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

class CategoryTest < ActiveSupport::TestCase
  setup do
    _, @account = register_user
    # Flipper.enable(:api, @account)

    @category = create_category(@account)
    @webhook = create_webhook(@account)
  end

  test 'should create a category' do
    name = Faker::Lorem.sentence
    description = Faker::Lorem.paragraph
    category = Category.create!(account: @account, name:, description:)

    assert category.persisted?
    assert_equal 0, category.errors.count
    assert_equal name, category.name
    assert_equal description, category.description
    assert_equal 2, category.account.categories.count
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

  test 'should deliver webhook when category is created' do
    assert_enqueued_with(job: WebhookDeliverJob, queue: 'webhooks') do
      create_category(@account)
    end
  end

  test 'should deliver webhook when category is updated' do
    assert_enqueued_with(job: WebhookDeliverJob, queue: 'webhooks') do
      @category.update(name: 'test')
    end
  end

  test 'should deliver webhook when category is deleted' do
    assert_enqueued_with(job: WebhookDeliverJob, queue: 'webhooks') do
      @category.discard
    end
  end
end

