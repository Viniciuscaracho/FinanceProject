# frozen_string_literal: true

require "test_helper"

class TransactionTest < ActiveSupport::TestCase
  setup do
    @user, @account = register_user
    @bank_account = create_bank_account(@account)
    @webhook = create_webhook(@account)
    @transaction = create_transaction(@account, @bank_account)
    @transaction_two = create_transaction(@account, @bank_account)
    @transaction_three = create_transaction(@account, @bank_account)
    @cost_center = create_cost_center(@account)
    @category = create_category(@account)
    @contact = create_contact(@account)
    @payment_plan = PaymentPlan.new({
                                     type_cd: 1,
                                     frequency_cd: 1,
                                     number_of_installments: 12,
                                     account: @account
                                   })
    # Flipper.enable(:api, @account)
  end
  test 'should be valid' do
    assert @transaction.valid?
  end

  # Presence Validations
  %i[due_date bank_account amount_cents exchanged_amount_cents amount_currency exchanged_amount_currency transaction_type_cd].each do |attr|
    test "#{attr} should be present" do
      @transaction.public_send("#{attr}=", nil)
      assert_not @transaction.valid?
    end
  end

  # Numericality Validations
  %i[amount_cents exchanged_amount_cents].each do |attr|

    test "#{attr} should be greater than or equal to 0" do
      @transaction.public_send("#{attr}=", -1)
      assert_not @transaction.valid?
    end

    test "#{attr} should be less than or equal to 999999999999" do
      @transaction.public_send("#{attr}=", 1_000_000_000_000)
      assert_not @transaction.valid?
    end
  end

  # Custom Validations
  test 'validate_transfer_same_bank_account should prevent transfer to the same bank account' do

    @transaction.bank_account = @bank_account
    @transaction.transfer_to = @bank_account
    @transaction.transaction_type = :transfer
    assert_not @transaction.valid?
  end

  test "validate_bank_account should validate presence of bank_account_id" do
    @transaction.bank_account_id = nil
    assert_not @transaction.valid?
  end

  test 'validate_transaction_type should validate presence of transaction_type_cd' do
    @transaction.transaction_type_cd = nil
    assert_not @transaction.valid?
  end

  test 'should deliver webhook when transaction is created' do
    assert_enqueued_with(job: WebhookDeliverJob, queue: 'webhooks') do
      create_transaction(@account, @bank_account)
    end
  end

  test 'should deliver webhook when transaction is updated' do
    assert_enqueued_with(job: WebhookDeliverJob, queue: 'webhooks') do
      @transaction.update(name: 'test')
    end
  end

  test 'should deliver webhook when transaction is deleted' do
    assert_enqueued_with(job: WebhookDeliverJob, queue: 'webhooks') do
      @transaction.destroy
    end
  end

  test "should belong to payment_plan" do
    payment_plan_params = {
      type_cd: 1,
      frequency_cd: 1,
      number_of_installments: 12,
      account: @account
    }

    @transaction = Transaction.new(
      account: @account,
      amount_cents: 1000,
      due_date: Date.today,
      bank_account: @bank_account,
      payment_plan_attributes: payment_plan_params
    )
    assert @transaction.save!

    created_payment_plan = @transaction.payment_plan
    assert_not_nil created_payment_plan
    assert_equal 1, created_payment_plan.type_cd
    assert_equal 1, created_payment_plan.frequency_cd
    assert_equal 12, created_payment_plan.number_of_installments
    assert_equal @account.id, created_payment_plan.account_id
  end

  test "should be valid with a payment plan" do
    transaction = Transaction.new(
      account: @account,
      amount_cents: 1000,
      due_date: Date.today,
      bank_account: @bank_account,
      payment_plan_attributes: {
        type_cd: 1,
        frequency_cd: 1,
        number_of_installments: 12,
        account: @account
      }
    )
    assert transaction.valid?
  end

  test "should be valid without a payment plan" do
    transaction = Transaction.new(
      account: @account,
      amount_cents: 1000,
      due_date: Date.today,
      bank_account: @bank_account,
      payment_plan: nil
    )
    assert transaction.valid?
  end

  test 'should be valid with valid attributes' do
    assert @payment_plan.valid?
  end

  test 'should be invalid without frequency if recurring' do
    @payment_plan.type = :recurring
    @payment_plan.frequency = nil
    assert_not @payment_plan.valid?
  end

  test 'should be invalid without number_of_installments if recurring' do
    @payment_plan.type = :recurring
    @payment_plan.number_of_installments = nil
    assert_not @payment_plan.valid?
  end

  test 'should be invalid without amount_cents if installment' do
    @payment_plan.type = :installment
    @payment_plan.amount_cents = nil
    assert_not @payment_plan.valid?
  end

  test 'should be invalid without frequency if installment' do
    @payment_plan.type = :installment
    @payment_plan.frequency = nil
    assert_not @payment_plan.valid?
  end

  test 'should be invalid without number_of_installments if installment' do
    @payment_plan.type = :installment
    @payment_plan.number_of_installments = nil
    assert_not @payment_plan.valid?
  end

  test 'should be invalid if number_of_installments is less than MIN_NUMBER_OF_INSTALLMENTS' do
    @payment_plan.number_of_installments = PaymentPlan::MIN_NUMBER_OF_INSTALLMENTS - 1
    assert_not @payment_plan.valid?
  end

  test 'should be invalid if number_of_installments is greater than MAX_NUMBER_OF_INSTALLMENTS' do
    @payment_plan.number_of_installments = PaymentPlan::MAX_NUMBER_OF_INSTALLMENTS + 1
    assert_not @payment_plan.valid?
  end

  test 'should correctly parse string to cents for amount_cents' do
    @payment_plan.amount_cents = "1.234,56"
    assert_equal 123456, @payment_plan.amount_cents
  end

  test 'should sum amount_cents of transactions after save if installment' do
    @payment_plan.type = :installment
    @payment_plan.transactions << [@transaction_two, @transaction_three]

    @payment_plan.save
    assert_equal 4000, @payment_plan.amount_cents
  end

  test 'should not sum amount_cents of transactions if not installment' do
    @payment_plan.type = :recurring
    @payment_plan.transactions << [@transaction, @transaction_two]

    @payment_plan.save
    assert_not_equal 4000, @payment_plan.amount_cents
  end
end
