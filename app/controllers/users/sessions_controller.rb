# frozen_string_literal: true

module Users
  class SessionsController < Devise::SessionsController
    # before_action :configure_sign_in_params, only: [:create]

    # GET /resource/sign_in
    # def new
    #   super
    # end

    # POST /resource/sign_in
    # def create
    #   super
    # end

    # DELETE /resource/sign_out
    # def destroy
    #   super
    # end

    protected

    # Override the default after_sign_in_path_for method
    def after_sign_in_path_for(resource_or_scope)
      return new_checkout_portal_session_url if force_subscription?
      return root_path(show_welcome: true) if current_user.onboarding_created_at.blank?

      stored_location_for(resource_or_scope) || root_path
    end

    # If you have extra params to permit, append them to the sanitizer.
    # def configure_sign_in_params
    #   devise_parameter_sanitizer.permit(:sign_in, keys: [:attribute])
    # end
  end
end
