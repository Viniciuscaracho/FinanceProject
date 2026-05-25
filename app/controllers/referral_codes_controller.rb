# frozen_string_literal: true

# This controller is used to redirect to the sign up page with the referral code
class ReferralCodesController < ApplicationController
  skip_before_action :authenticate_user!, only: %i[show]
  before_action :set_referral_code, only: %i[destroy]

  def index
    query = Current.account.referral_codes.kept.order(:code)

    @pagy, @records = pagy(query)
    @records.load
  end

  # GET /announcements/1 or /announcements/1.json
  def show
    return redirect_to root_path if user_signed_in?

    @referral_code = ReferralCode.find_by(code: params[:id])
    return redirect_to root_path if @referral_code.blank?

    cookies.signed.permanent[:__orbi_referral_code] = @referral_code.code
  end

  def destroy
    @referral_code.discard
    respond_to do |format|
      notice = t('.success')
      format.html { redirect_to referral_codes_url, notice: }
      format.json { head :no_content }
      format.turbo_stream { flash.now[:notice] = notice }
    end
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_referral_code
    @referral_code = Current.account.referral_codes.find_by(id: params[:id])
  end
end
