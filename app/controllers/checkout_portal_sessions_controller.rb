# frozen_string_literal: true

class CheckoutPortalSessionsController < ApplicationController
  before_action :set_account, only: %i[new]

  def new
    redirect_to root_path, notice: t('shared.already_subscribed') if @account.subscribed?

    @session = Stripe::CustomerSession.create(
      {
        customer: @account.processor_customer_id,
        components: { pricing_table: { enabled: true } }
      }
    )
    return unless @account.use_coupon?

    Stripe::Customer.update(@account.processor_customer_id, { coupon: @account.referral_code.code })
  end

  def success
    redirect_to root_path, notice: t('.success')
  end

  private

  def set_account
    @account = if params[:account_id].present?
                 Current.user.accounts.find_by(id: params[:account_id])
               else
                 Current.account
               end
  end
end
