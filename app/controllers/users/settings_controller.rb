# frozen_string_literal: true

module Users
  class SettingsController < SettingsController
    protected

    # Use callbacks to share common setup or constraints between actions.
    def set_target
      @target = Current.account.users.find(params[:user_id])
    end

    # Only allow a list of trusted parameters through.
    def settings_params
      params.require(:settings).permit(
        transactions: {},
        notifications: {}
      )
    end
  end
end
