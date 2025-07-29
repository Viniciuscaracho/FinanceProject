# frozen_string_literal: true

# == Schema Information
#
# Table name: bank_accounts
#
#  id                       :bigint           not null, primary key
#  account_number           :string
#  account_type_cd          :integer          default(0), not null
#  agency                   :string
#  balance_cents            :bigint           default(0), not null
#  balance_currency         :string(3)        default("BRL"), not null
#  default                  :boolean          default(FALSE), not null
#  discarded_at             :datetime
#  initial_balance_cents    :bigint           default(0), not null
#  initial_balance_currency :string(3)        default("BRL"), not null
#  name                     :string           not null
#  created_at               :datetime         not null
#  updated_at               :datetime         not null
#  account_id               :bigint           not null
#  bank_id                  :bigint
#  created_by_id            :bigint
#  updated_by_id            :bigint
#
# Indexes
#
#  index_bank_accounts_on_account_id           (account_id)
#  index_bank_accounts_on_account_id_and_id    (account_id,id)
#  index_bank_accounts_on_account_type_cd      (account_type_cd)
#  index_bank_accounts_on_bank_id              (bank_id)
#  index_bank_accounts_on_created_by_id        (created_by_id)
#  index_bank_accounts_on_discarded_at         (discarded_at)
#  index_bank_accounts_on_multisearch_columns  (account_id,discarded_at NULLS FIRST)
#  index_bank_accounts_on_updated_by_id        (updated_by_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (bank_id => banks.id)
#  fk_rails_...  (created_by_id => users.id)
#  fk_rails_...  (updated_by_id => users.id)
#
require "test_helper"

class BankAccountTest < ActiveSupport::TestCase
  setup do
    @user, @account = register_user
    # Flipper.enable(:api, @account)

    @bank_account = create_bank_account(@account)
    @webhook = create_webhook(@account)
  end

  test "should be valid with all required attributes" do
    assert @bank_account.valid?, "Expected bank account to be valid with all required attributes"
  end

  test "should be invalid without a name" do
    @bank_account.name = nil
    assert_not @bank_account.valid?, "Expected bank account to be invalid without a name"
  end

  test "should be invalid without initial balance" do
    @bank_account.initial_balance_cents = nil
    assert_not @bank_account.valid?, "Expected bank account to be invalid without initial balance"
  end

  test "should be invalid with initial balance exceeding limit" do
    @bank_account.initial_balance_cents = 1_000_000_000_000
    assert_not @bank_account.valid?, "Expected bank account to be invalid with initial balance exceeding limit"
  end

  test "should update attributes" do
    @bank_account.update(
      default: false,
      name: "Bank_Test2",
      agency: "1234",
      account_number: "12345678"
    )

    assert_not @bank_account.default?
    assert_equal "Bank_Test2", @bank_account.name
    assert_equal "1234", @bank_account.agency
    assert_equal "12345678", @bank_account.account_number
    assert @bank_account.current_account?, "Expected to be a current account"
    assert_not @bank_account.savings_account?, "Expected not to be a savings account"
    assert_equal 0, @bank_account.balance_cents, "Expected balance to be zero"
    assert_equal "BRL", @bank_account.initial_balance_currency, "Expected initial balance currency to be BRL"
  end

  test "should toggle archived status" do
    @bank_account.toggle_archived
    assert @bank_account.archived?, "Expected bank account to be archived after toggling"
    @bank_account.toggle_archived
    assert_not @bank_account.archived?, "Expected bank account not to be archived after toggling"
  end

  test "should deliver webhook when bank account is created" do
    assert_enqueued_with(job: WebhookDeliverJob, queue: "webhooks") do
      create_bank_account(@account)
    end
  end

  test "should deliver webhook when bank account is updated" do
    assert_enqueued_with(job: WebhookDeliverJob, queue: "webhooks") do
      @bank_account.update!(initial_balance_cents: 123)
    end
  end

  test "should deliver webhook when bank account is deleted" do
    assert_enqueued_with(job: WebhookDeliverJob, queue: "webhooks") do
      @bank_account.discard
    end
  end
end
