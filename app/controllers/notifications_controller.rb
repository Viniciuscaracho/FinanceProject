# frozen_string_literal: true

class NotificationsController < ApplicationController
  attr_accessor :notifications_count

  before_action :set_current_bank_account
  before_action :set_notifications, only: %i[index count]
  before_action :set_notification, only: %i[show destroy]
  before_action :set_delayed_payments, only: %i[index count delayed_payments_modal]
  before_action :set_without_category, only: %i[index count without_category_modal]

  # GET /categories or /categories.json
  def index
    @notifications = @notifications.order(created_at: :desc)
    @notifications.load
  end

  def count
    @alerts = [@without_category.any?, @delayed_payments.any?].count(true)
    @notifications_count = @notifications.count + @alerts
  end

  def show
    @notification.mark_as_read
    redirect_to @notification.url
  end

  def without_category_modal
    @pagy, @without_category = pagy_countless(@without_category)
  end

  def delayed_payments_modal
    @pagy, @delayed_payments = pagy_countless(@delayed_payments)
  end

  def dismiss_all
    respond_to do |format|
      if current_account_user.notifications.mark_as_read!
        notice = t('.success')
        format.html { redirect_to notifications_url, notice: }
        format.json { render :show, status: :created, location: @notification }
        format.turbo_stream { flash.now.notice = notice }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @notification.errors, status: :unprocessable_entity }
      end
    end
  end

  def mark_as_read
    respond_to do |format|
      if @notification.mark_as_read!
        notice = t('.success')
        format.html { redirect_to notifications_url, notice: }
        format.json { render :show, status: :created, location: @notification }
        format.turbo_stream { flash.now.notice = notice }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @notification.errors, status: :unprocessable_entity }
      end
    end
  end

  def mark_as_unread
    respond_to do |format|
      if @notification.mark_as_read!
        notice = t('.success')
        format.html { redirect_to notifications_url, notice: }
        format.json { render :show, status: :created, location: @notification }
        format.turbo_stream { flash.now.notice = notice }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @notification.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /categories/1 or /categories/1.json
  def destroy; end

  private

  def set_notifications
    @notifications = current_account_user.notifications.unread
  end

  # Use callbacks to share common setup or constraints between actions.
  def set_notification
    @notification = current_account_user.notifications.find(params[:id])
  end

  def set_current_bank_account
    @default_bank_accounts = Current.account.bank_accounts.kept
  end

  def set_delayed_payments
    @delayed_payments = Current.account.transactions
                               .where(bank_account: @default_bank_accounts)
                               .only_simple_and_children.delayed
  end

  def set_without_category
    @without_category = Current.account.transactions
                               .where(category: nil, bank_account: @default_bank_accounts)
                               .where(transaction_type_cd: [0..4])
                               .only_simple_and_children
  end
end
