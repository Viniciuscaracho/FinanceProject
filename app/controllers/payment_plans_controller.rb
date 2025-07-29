# frozen_string_literal: true

class PaymentPlansController < ApplicationController
  before_action :set_transaction, only: %i[new create]
  before_action :set_payment_plan, only: %i[edit update destroy]
  before_action :set_first_transaction, only: %i[edit update]

  def new
    result = PaymentPlans::New.call(account: Current.account, transaction: @transaction)
    @payment_plan = result.payment_plan
    @total_amount = result.total_amount
    @number_of_installments = result.number_of_installments
    @current_bank_account = @transaction.bank_account
  end

  def edit
    result = PaymentPlans::Edit.call(payment_plan: @payment_plan)
    @number_of_installments = result.number_of_installments
    @total_amount = result.total_amount
    @current_bank_account = @transaction.bank_account
  end

  def create
    @payment_plan = Current.account.payment_plans.new(payment_plan_params)
    @current_bank_account = @transaction.bank_account

    if params[:changed].present?
      result = PaymentPlans::Creating.call(
        payment_plan: @payment_plan,
        changed: params[:changed].to_sym
      )
      @total_amount = result.total_amount
      @number_of_installments = result.number_of_installments
      @payment_plan = result.payment_plan
    else
      ActiveRecord::Base.transaction do
        result = PaymentPlans::Create.call(payment_plan: @payment_plan)
        if result.success?
          @transaction.destroy
          @current_bank_account.update_balance!

          flash.now.notice = result.message
        else
          flash.now.alert = result.message
          return
        end
      end
    end
  end

  def update
    @current_bank_account = @transaction.bank_account
    @payment_plan.assign_attributes(payment_plan_params)

    if params[:changed].present?
      result = PaymentPlans::Updating.call(
        payment_plan: @payment_plan,
        changed: params[:changed].to_sym
      )
      @total_amount = result.total_amount
      @number_of_installments = result.number_of_installments
      @payment_plan = result.payment_plan
    else
      ActiveRecord::Base.transaction do
        result = PaymentPlans::Update.call(payment_plan: @payment_plan)
        if result.success?
          @current_bank_account.update_balance!
          @transaction.reload
          flash.now.notice = result.message
        else
          flash.now.alert = result.message
        end
      end
    end
  end

  def destroy; end

  protected

  def set_payment_plan
    @payment_plan = Current.account.payment_plans.find(params[:id])
  end

  def set_transaction
    @transaction = Current.account.transactions.find(params[:transaction_id])
  end

  def set_first_transaction
    @transaction = @payment_plan.transactions.order(:installment_number).first
  end

  def payment_plan_params
    payment_plan_attrs = params.require(:payment_plan).permit(
      :type,
      :amount_cents,
      :amount_type,
      :number_of_installments,
      :frequency,
      transactions_attributes: {}
    ).to_h

    account         = @transaction.account
    bank_account_id = @transaction.bank_account_id
    contact_id      = @transaction.contact_id
    category_id     = @transaction.category_id
    cost_center_id  = @transaction.cost_center_id
    tag_list        = @transaction.tag_list

    payment_plan_attrs[:transactions_attributes].each do |_, transaction|
      next if transaction[:id].present?
      transaction.merge!(account:, bank_account_id:, contact_id:, category_id:, cost_center_id:, tag_list:)
    end

    payment_plan_attrs
  end
end
