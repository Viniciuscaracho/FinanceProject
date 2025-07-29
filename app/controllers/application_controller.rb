# frozen_string_literal: true

class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception, unless: -> { Rails.env.development? && request.path == '/users/sign_in' }

  # Callbacks
  before_action :authenticate_user!
  before_action :configure_permitted_parameters, if: :devise_controller?
  before_action :redirect_to_checkout_page, if: :force_subscription?

  # Helper methods
  helper_method :encoded_filter, :decoded_filter, :force_subscription?

  impersonates :user

  # Include Required Concerns
  include ApplicationHelper
  include ActiveStorage::SetCurrent unless Rails.env.production?
  include DeviceDetector
  include SetLocale
  include SetTimeZone
  include SetCurrent
  include Pagy::Backend
  include Sortable
  include RailsEventStoreHelper


  rescue_from CanCan::AccessDenied do |_exception|
    respond_to do |format|
      alert = t('shared.you_are_not_authorized_to_access_this_page')
      format.json { head :forbidden }
      format.html { redirect_to redirect_if_access_forbidden, alert: }
      format.turbo_stream { flash.now.alert = alert }
    end
  end

  # Methods
  def encoded_filter(hash)
    return if hash.blank?

    Base64.encode64(hash.to_json)
  end

  def decoded_filter(str)
    return if str.blank?

    JSON.parse(Base64.decode64(str))
  end

  protected

  def redirect_if_access_forbidden
    if Current.user.policy?(:home, :read)
      root_path
    elsif Current.user.policy?(:reports, :read)
      reports_path
    elsif Current.user.policy?(:contacts, :read)
      contacts_path
    elsif Current.user.policy?(:categories, :read)
      categories_path
    elsif Current.user.policy?(:cost_centers, :read)
      cost_centers_path
    elsif Current.user.policy?(:bank_accounts, :read)
      bank_accounts_path
    elsif Current.user.policy?(:imports, :read)
      imports_path
    else
      Transaction.transaction_types.each do |transaction_type|
        tt = transaction_type.first
        return transactions_path(transaction_type: tt.to_sym) if Current.user.policy?(:transactions,
                                                                                      tt.pluralize.to_sym, :read)
      end

      access_forbidden_path
    end
  end

  def authenticated_user
    return t('shared.guest') unless user_signed_in?

    current_user
  end

  def redirect_to_checkout_page
    redirect_to new_checkout_portal_session_url
  end

  def oauth_callback
    # Redirecionar para o frontend React com os parâmetros
    redirect_to "#{ENV['FRONTEND_URL'] || 'http://localhost:5173'}/oauth/callback?#{request.query_string}"
  end

  def after_sign_in_path_for(resource_or_scope)
    return new_checkout_portal_session_url if force_subscription?
    return root_path(show_welcome: true) if current_user.onboarding_created_at.blank?

    stored_location_for(resource_or_scope) || super
  end

  def configure_permitted_parameters
    user_keys = %i[first_name last_name preferred_language time_zone terms_of_service]
    account_keys = [
      {
        my_accounts_attributes: [
          :default_currency,
          :processor_plan_id,
          :account_type,
          { company_attributes: :name }
        ]
      }
    ]

    signup_keys = user_keys + [:invite] + account_keys
    accept_invitation_keys = user_keys + account_keys

    devise_parameter_sanitizer.permit(:sign_up, keys: signup_keys)
    devise_parameter_sanitizer.permit(:accept_invitation, keys: accept_invitation_keys)
  end

  def ensure_frame_response
    return unless Rails.env.development?
    return if request.format.json?

    ensure_frame_response_redirect unless turbo_frame_request?
  end

  def ensure_frame_response_redirect
    redirect_to root_path
  end

  def ensure_account_is_active
    return if Current.account.active? || Current.account.trial_period?

    result = Subscriptions::CreateCheckoutPortalSession.call(account: Current.account)
    redirect_to result.session.url, allow_other_host: true, status: :see_other
  end

  def header_cookies
    request.headers['Cookie'].split('; ').map do |cookie|
      key, value = cookie.split '='
      { name: key, value:, domain: request.headers['Host'] }
    end
  end

  def force_subscription?
    return false unless user_signed_in?
    return false if controller_name == 'checkout_portal_sessions'

    current_user&.account&.force_subscription? || false
  end
end
