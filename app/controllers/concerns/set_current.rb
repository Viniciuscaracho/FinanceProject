# frozen_string_literal: true

module SetCurrent
  extend ActiveSupport::Concern

  included do |base|
    set_current_tenant_through_filter

    before_action :set_request_details if base < ActionController::Base
    helper_method :current_account, :current_account_user
  end

  def set_request_details
    Current.request_id = request.uuid
    Current.user_agent = request.user_agent
    Current.ip_address = request.ip
    Current.time = Time.zone.now
    Current.date = Date.current
    return unless user_signed_in?

    Current.user = current_user
    Current.account = find_current_account || fallback_account
    set_current_tenant(Current.account)
    set_sentry_user
    set_sentry_tags
  end

  def current_account
    Current.account
  end

  def current_account_user
    Current.account.account_users.find_by(user: Current.user)
  end

  private

  def find_current_account
    current_user.account.presence || current_user.accounts.first
  end

  def fallback_account
    sign_out_with_alert t('devise.failure.no_account')
  end

  def set_sentry_user
    Sentry.set_user(
      id: Current.user.id,
      email: Current.user.email,
      username: Current.user.name,
      ip_address: Current.ip_address
    )
  end

  def set_sentry_tags
    Sentry.set_tags(
      request_id: Current.request_id,
      user_agent: Current.user_agent
    )
  end

  def sign_out_with_alert(alert)
    sign_out(current_user)
    redirect_to new_user_session_path, alert:
  end
end
