# frozen_string_literal: true

require 'test_helper'

class TransactionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user, @account = register_user
    @bank_account = @account.default_bank_account
    @transaction = create_transaction @account, @bank_account
    sign_in @user
  end

  test 'should get index' do
    get transactions_url
    assert_response :success
  end

  test 'should get new' do
    get new_transaction_url
    assert_response :success
  end

  test 'should create unpaid transaction' do
    assert_difference('Transaction.count') do
      post transactions_url,
           params: {
             format: :turbo_stream,
             transaction: {
               amount_cents: 20_000,
               amount_currency: @transaction.amount_currency,
               category_id: @transaction.category_id,
               contact_id: @transaction.contact_id,
               bank_account_id: @transaction.bank_account_id,
               cost_center_id: @transaction.cost_center_id,
               description: @transaction.description,
               due_date: @transaction.due_date,
               paid: @transaction.paid,
               payment_method: @transaction.payment_method,
               payment_type: @transaction.payment_type,
               competency_date: @transaction.competency_date,
             }
           }
    end

    assert_response :success
  end

  test 'should create paid transaction' do
    assert_difference('Transaction.count', 1) do
      post transactions_url,
           params: {
             format: :turbo_stream,
             transaction: {
               amount_cents: 20_000,
               amount_currency: @transaction.amount_currency,
               category_id: @transaction.category_id,
               contact_id: @transaction.contact_id,
               bank_account_id: @transaction.bank_account_id,
               cost_center_id: @transaction.cost_center_id,
               description: @transaction.description,
               due_date: @transaction.due_date,
               paid: true,
               payment_method: @transaction.payment_method,
               payment_type: @transaction.payment_type,
               competency_date: @transaction.competency_date
             }
           }
    end

    transaction = Transaction.last

    assert_response :success
    assert transaction.paid?
  end

  test 'should show transaction' do
    get transactions_url(@transaction)
    assert_response :success
  end

  test 'should get edit' do
    get edit_transaction_url(@transaction,
                             {
                               bank_account_id: @transaction.bank_account_id,
                               month: @transaction.due_date,
                               transaction_type: @transaction.transaction_type
                             })
    assert_response :success
  end

  test 'should bulk move to' do
    transactions = create_list_of_transactions @account, @bank_account, number_of_transactions: 10
    second_bank_account = create_bank_account @account

    put bulk_move_to_transactions_url,
        params: {
          format: :turbo_stream,
          transaction_ids: transactions.map(&:id),
          selected_bank_account_id: second_bank_account.id,
          selected_transaction_type: :tax
        }

    assert_response :success
  end

  test 'should bulk mark as paid' do
    transactions = create_list_of_transactions @account, @bank_account, number_of_transactions: 10

    put bulk_mark_as_paid_transactions_url,
        params: {
          format: :turbo_stream,
          transaction_ids: transactions.map(&:id)
        }

    assert_response :success
  end

  test 'should bulk update' do
    transactions = create_list_of_transactions @account, @bank_account, number_of_transactions: 10

    put bulk_update_transactions_url,
        params: {
          format: :turbo_stream,
          transaction_ids: transactions.map(&:id),
          category_id: @transaction.category_id,
          contact_id: @transaction.contact_id,
          cost_center_id: @transaction.cost_center_id,
          tag_list: @transaction.tag_list
        }

    assert_response :success
  end

  test 'should update transaction' do
    patch transaction_url(@transaction),
          params: {
            format: :turbo_stream,
            transaction: {
              amount_cents: @transaction.amount_cents,
              amount_currency: @transaction.amount_currency,
              category_id: @transaction.category_id,
              contact_id: @transaction.contact_id,
              bank_account_id: @transaction.bank_account_id,
              cost_center_id: @transaction.cost_center_id,
              description: @transaction.description,
              due_date: @transaction.due_date,
              paid: @transaction.paid,
              paid_at: @transaction.paid_at,
              payment_method: @transaction.payment_method,
              payment_type: @transaction.payment_type,
              competency_date: @transaction.competency_date
            }
          }
    assert_response :success
  end

  test 'should setup recurrence for transaction' do
    get setup_recurrence_transaction_path(@transaction)

    assert_response :success
  end

  test 'should permit correct parameters for create recurrence' do
    payment_plan_params = {
      transaction: {
        payment_plan_attributes: {
          type_cd: 1,
          number_of_installments: 12,
          frequency_cd: 3,
          account: @account
        }
      }
    }

    @transaction = create_transaction @account, @bank_account
    patch create_recurrence_transaction_path(@transaction, format: :turbo_stream), params: payment_plan_params

    expected_params = {
      payment_plan_attributes: {
        type_cd: 1,
        number_of_installments: 12,
        frequency_cd: 3,
        account: @account
      }
    }

    @transaction.reload
    assert_response :success
    assert_equal expected_params[:payment_plan_attributes][:type_cd], @transaction.payment_plan.type_cd
    assert_equal expected_params[:payment_plan_attributes][:number_of_installments], @transaction.payment_plan.number_of_installments
    assert_equal expected_params[:payment_plan_attributes][:frequency_cd], @transaction.payment_plan.frequency_cd
    assert_equal expected_params[:payment_plan_attributes][:account], @transaction.payment_plan.account
  end

  test 'should create recurring transactions from current transaction' do
    assert_difference('Transaction.count', 5) do
      patch create_recurrence_transaction_path(@transaction),
            params: {
              format: :turbo_stream,
              transaction: {
                payment_plan_attributes: {
                  type: 'recurring',
                  number_of_installments: 6,
                  frequency: 'monthly'
                }
              }
            }
      assert_response :success
    end

    @transaction.reload

    assert @transaction.payment_plan.recurring?
    assert_equal 6, @transaction.payment_plan.number_of_installments
    assert_equal 6, @transaction.payment_plan.transactions.count

    @transaction.payment_plan.transactions.order(:installment_number).each_with_index do |transaction, index|
      assert_equal index + 1, transaction.installment_number
      assert_equal @transaction.payment_type, transaction.payment_type
      assert_equal @transaction.installment_type, transaction.installment_type
      assert_equal @transaction.amount_cents, transaction.amount_cents
      assert_equal @transaction.amount_currency, transaction.amount_currency
      assert_equal @transaction.category_id, transaction.category_id
      assert_equal @transaction.contact_id, transaction.contact_id
      assert_equal @transaction.bank_account_id, transaction.bank_account_id
      assert_equal @transaction.cost_center_id, transaction.cost_center_id
      assert_equal @transaction.name, transaction.name
      assert_equal @transaction.description, transaction.description
      assert_equal @transaction.due_date + index.months, transaction.due_date
      assert_not transaction.paid
    end
  end

  test 'should create installments from current transaction' do
    assert_difference('Transaction.count', 2) do
      post payment_plans_path,
           params: {
             format: :turbo_stream,
             commit: 'Salvar',
             transaction_id: @transaction.id,
             payment_plan: {
               type: 'installment',
               number_of_installments: 3,
               frequency: 'monthly',
               amount_cents: @transaction.amount_cents,
               transactions_attributes: {
                 0 => @transaction.dup.attributes.except('id', 'created_at', 'updated_at', 'payment_plan_id', 'installment_number', 'due_date').merge(
                   payment_type: :installment,
                   installment_number: 1,
                   installment_total: 3,
                   installment_type: :monthly,
                   amount_cents: @transaction.amount_cents / 3,
                   due_date: @transaction.due_date
                 ),
                 1 => @transaction.dup.attributes.except('id', 'created_at', 'updated_at', 'payment_plan_id', 'installment_number', 'due_date').merge(
                   payment_type: :installment,
                   installment_number: 2,
                   installment_total: 3,
                   installment_type: :monthly,
                   amount_cents: @transaction.amount_cents / 3,
                   due_date: @transaction.due_date + 1.month
                 ),
                 3 => @transaction.dup.attributes.except('id', 'created_at', 'updated_at', 'payment_plan_id', 'installment_number', 'due_date').merge(
                   payment_type: :installment,
                   installment_number: 3,
                   installment_total: 3,
                   installment_type: :monthly,
                   amount_cents: @transaction.amount_cents / 3,
                   due_date: @transaction.due_date + 2.months
                 )
               }
             }
           }
      assert_response :success
    end

    @payment_plan = PaymentPlan.last

    assert @payment_plan.installment?
    assert_equal 3, @payment_plan.number_of_installments
    assert_equal 3, @payment_plan.transactions.count

    @payment_plan.transactions.order(:installment_number).each_with_index do |transaction, index|
      assert_equal index + 1, transaction.installment_number
      assert_equal :installment, transaction.payment_type
      assert_equal :monthly, transaction.installment_type
      assert_equal @transaction.amount_cents / 3, transaction.amount_cents
      assert_equal @transaction.amount_currency, transaction.amount_currency
      assert_equal @transaction.category_id, transaction.category_id
      assert_equal @transaction.contact_id, transaction.contact_id
      assert_equal @transaction.bank_account_id, transaction.bank_account_id
      assert_equal @transaction.cost_center_id, transaction.cost_center_id
      assert_equal @transaction.description, transaction.description
      assert_equal @transaction.due_date + index.months, transaction.due_date
      assert_equal @transaction.name, transaction.name
      assert_not transaction.paid
    end
  end

  test 'should destroy transaction' do
    assert_difference('Transaction.count', -1) do
      delete transaction_url(@transaction, params: { format: :turbo_stream, option: :only_this_installment })
    end

    assert_response :success
  end

  test "should add amount details item when update_amount_details with 'add' button" do
    TransactionsController.any_instance.stubs(:recalculate_amount_details).returns(true)
    TransactionsController.any_instance.stubs(:render).returns(true)
    TransactionsController.any_instance.stubs(:redirect_to).returns(true)

    @detail_transaction, @children = create_transaction_and_children(@account, @bank_account)
    result = @detail_transaction

    patch update_amount_details_transaction_url(result, format: :turbo_stream), params: {
      button: :add,
      kind: :detailed,
      transaction: {
        children_attributes: {
          '0': {
            kind: :child,
            account_id: result.account_id,
            bank_account_id: result.bank_account_id,
            transaction_type: :revenue,
            due_date: Date.current,
            name: nil,
            contact_id: result.contact_id,
            category_id: result.category_id,
            cost_center_id: result.cost_center_id,
            amount_cents: 500,
            paid: false,
            competency_date: Date.current,
            _destroy: false,
            tag_list: []
          },
          '1': {
            kind: :child,
            account_id: result.account_id,
            bank_account_id: result.bank_account_id,
            transaction_type: :revenue,
            due_date: Date.current,
            name: nil,
            contact_id: result.contact_id,
            category_id: result.category_id,
            cost_center_id: result.cost_center_id,
            amount_cents: 500,
            paid: false,
            competency_date: Date.current,
            _destroy: false,
            tag_list: []
          }
        }
      }
    }

    assert_response :success
  end

  test "should save amount details when update_amount_details with 'save' button" do
    TransactionsController.any_instance.stubs(:recalculate_amount_details).returns(true)
    TransactionsController.any_instance.stubs(:render).returns(true)
    TransactionsController.any_instance.stubs(:redirect_to).returns(true)

    @detail_transaction, @children = create_transaction_and_children(@account, @bank_account)
    result = @detail_transaction

    assert_difference('result.children.count', 2) do
      patch update_amount_details_transaction_url(result, format: :turbo_stream), params: {
        button: :save,
        authenticity_token: '[FILTERED]',
        transaction: {
          kind: :detailed,
          amount_cents: '0',
          children_attributes: {
            '0': {
              transaction_type: :revenue,
              kind: :child,
              account_id: result.account_id,
              bank_account_id: result.bank_account_id,
              due_date: Date.current,
              name: '',
              contact_id: result.contact_id,
              category_id: result.category_id,
              cost_center_id: result.cost_center_id,
              amount_cents: '0',
              paid: false,
              competency_date: ''
            },
            '1': {
              transaction_type: :revenue,
              kind: :child,
              account_id: result.account_id,
              bank_account_id: result.bank_account_id,
              due_date: Date.current,
              name: '',
              contact_id: result.contact_id,
              category_id: result.category_id,
              cost_center_id: result.cost_center_id,
              amount_cents: '0',
              paid: false,
              competency_date: ''
            }
          }
        }
      }
    end
  end

  test "should destroy amount details when update_amount_details with 'destroy' button" do
    TransactionsController.any_instance.stubs(:recalculate_amount_details).returns(true)
    TransactionsController.any_instance.stubs(:render).returns(true)
    TransactionsController.any_instance.stubs(:redirect_to).returns(true)

    @detail_transaction, @children = create_transaction_and_children(@account, @bank_account)
    result = @detail_transaction

    patch update_amount_details_transaction_url(result, format: :turbo_stream), params: {
      button: :destroy_children,
      transaction: {
        children_attributes: {
          '0': {
            _destroy: true
          },
          '1': {
            _destroy: true
          }
        }
      }
    }
  end

  test "should call add_amount_details_item when update_amount_details with 'create_entry' button" do
    TransactionsController.any_instance.stubs(:recalculate_amount_details).returns(true)
    TransactionsController.any_instance.stubs(:render).returns(true)
    TransactionsController.any_instance.stubs(:redirect_to).returns(true)

    difference_amount_cents = 1000

    TransactionsController.any_instance.expects(:add_amount_details_item).with(amount_cents: difference_amount_cents).once
    @detail_transaction, @children = create_transaction_and_children(@account, @bank_account)
    transaction = @detail_transaction

    patch update_amount_details_transaction_url(@detail_transaction, format: :turbo_stream), params: {
      button: :create_entry,
      kind: :detailed,
      transaction: {
        kind: :child,
        amount_cents: '0',
        children_attributes: {
          '0': {
            transaction_type: :revenue,
            kind: :child,
            account_id: transaction.account_id,
            bank_account_id: transaction.bank_account_id,
            due_date: Date.current,
            name: '',
            contact_id: transaction.contact_id,
            category_id: transaction.category_id,
            cost_center_id: transaction.cost_center_id,
            amount_cents: '0',
            paid: false,
            competency_date: ''
          }
        }
      },
      difference_amount_cents: difference_amount_cents
    }
    assert_response :success
  end

  test 'should fetch transactions with pagination and start_date and end_date' do
    start_date = 1.month.ago.beginning_of_month
    end_date = 1.month.ago.end_of_month
    get transactions_url(q: '', after: nil, payment_status_filter: nil, start_date: start_date, end_date: end_date)

    assert_response :success
    assert_not_nil assigns(:pagination)
  end

  test 'should fetch paginated transactions with start_date and end_date' do
    start_date = 1.month.ago.beginning_of_month
    end_date = 1.month.ago.end_of_month
    get pagination_transactions_url(q: '', after: nil, payment_status_filter: nil, start_date: start_date, end_date: end_date, format: :html_document)

    assert_response :success
    assert_not_nil assigns(:pagination)
  end
end
