# frozen_string_literal: true

module Users
  class RegistrationsController < Devise::RegistrationsController
    invisible_captcha only: :create
    # before_action :configure_sign_up_params, only: [:create]
    # before_action :configure_account_update_params, only: [:update]

    # GET /resource/sign_up
    # def new
    #   super
    # end

    # POST /resource
    # def create
    #   super
    # end

    # GET /resource/edit
    # def edit
    #   super
    # end

    # PUT /resource
    # def update
    #   super
    # end

    # DELETE /resource
    # def destroy
    #   super
    # end

    # GET /resource/cancel
    # Forces the session data which is usually expired after sign
    # in to be expired now. This is useful if the user wants to
    # cancel oauth signing in/up in the middle of the process,
    # removing all OAuth session data.
    # def cancel
    #   super
    # end

    protected

    def build_resource(hash = {})
      self.resource = resource_class.new_with_session(hash, session)

      Rails.logger.debug session.inspect

      if params[:invite].present? && (invite = AccountInvitation.find_by(token: params[:invite]))
        resource.skip_confirmation!
        @account_invitation = invite
      else
        account = resource.my_accounts.first
        account ||= resource.my_accounts.new
        account.account_users.build(user: resource, role: :admin)

        company = account.company
        company ||= account.build_company
        company.email = resource.email

        account.account_type = params[:account_type] if params[:account_type]
        account.processor_plan_id = params[:plan_id] if params[:plan_id]

        # skip if user does not signing up through a referral code
        apply_referral_code(account) if exists_referral_code?
      end
    end

    def sign_up(resource_name, resource)
      super

      return unless @account_invitation

      # If user registered through an invitation, automatically accept it after signing in
      @account_invitation.accept!(current_user)

      # Clear redirect to account invitation since it's already been accepted
      stored_location_for(:user)
    end

    # If you have extra params to permit, append them to the sanitizer.
    # def configure_sign_up_params
    #   devise_parameter_sanitizer.permit(:sign_up, keys: [:attribute])
    # end

    # If you have extra params to permit, append them to the sanitizer.
    # def configure_account_update_params
    #   devise_parameter_sanitizer.permit(:account_update, keys: [:attribute])
    # end

    private

    # The path used after sign up.
    def after_sign_up_path_for(resource)
      # delete referral code from cookies if exists
      cookies.delete(:__procfy_referral_code) if exists_referral_code?
      super(resource)
    end

    def after_inactive_sign_up_path_for(_resource)
      # delete referral code from cookies if exists
      cookies.delete(:__procfy_referral_code) if exists_referral_code?
      new_user_session_path(after_inactive_sign_up: 'true')
    end

    def exists_referral_code?
      cookies.signed[:__procfy_referral_code].present?
    end

    def referral_code
      cookies.signed[:__procfy_referral_code]
    end

    def find_referral_code
      ReferralCode.find_by(code: referral_code)
    end

    def apply_referral_code(account)
      # find referral code by code from cookies
      @referral_code = find_referral_code
      # skip if referral code not found
      return if @referral_code.blank?
      # skip if referral code is not both and account type is not matched with referral code account type
      return if !@referral_code.both? && @referral_code.account_type != account.account_type

      account.referral_code    = @referral_code
      account.related_to       = @referral_code.referrer if @referral_code.referrer.is_a?(Account)
      account.relation_type_cd = Account.relation_types[:referred]
    end
  end
end
