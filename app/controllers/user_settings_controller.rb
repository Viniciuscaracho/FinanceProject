# frozen_string_literal: true

class UserSettingsController < ApplicationController
  before_action :ensure_frame_response, only: %i[edit]
  before_action :set_user

  # GET /user_settings/edit
  def edit; end

  # PATCH/PUT /user_settings or /user_settings/1.json
  def update
    # user_params = {
    #   preference_receive_email: params[:preference_receive_email].to_boolean,
    #   preference_all_bank_accounts: params[:preference_all_bank_accounts].to_boolean,
    #   preference_change_date: params[:preference_change_date].to_boolean
    # }

    respond_to do |format|
      if @user.update(user_params)
        notice = t('.success')
        format.html { redirect_to root_path, notice: }
        format.json { render :show, status: :ok, location: @user }
        format.turbo_stream { flash.now.notice = notice }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @user.errors, status: :unprocessable_entity }
      end
    end
  end

  def switch_account; end

  # PATCH/PUT /user_settings or /user_settings.json
  def update_current_account
    respond_to do |format|
      # Garante que a conta selecionada é do usuário logado
      selected_account = @user.accounts.find(switch_account_params[:account_id])
      if @user.update(account: selected_account)
        notice = t('.success')
        format.html { redirect_to root_path, notice: }
        format.json { render :show, status: :ok, location: @user }
        format.turbo_stream { flash.now.notice = notice }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @user.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_user
    @user = Current.user
  end

  # Only allow a list of trusted parameters through.
  def user_params
    user_settings_params = %i[first_name last_name email preferred_language time_zone avatar account_id terms_of_service
                              preference_receive_email preference_all_bank_accounts preference_change_date collapsed_menu
                              preference_static_totalizer preference_disable_view_recurrence preference_beta_tester]
    if params[:user][:password].present? || params[:user][:password_confirmation].present?
      user_settings_params << :password
      user_settings_params << :password_confirmation
    end
    params.require(:user).permit(user_settings_params)
  end

  def switch_account_params
    params.require(:user).permit(:account_id)
  end
end
