# frozen_string_literal: true

class AccountSettingsController < ApplicationController
  before_action :ensure_frame_response, only: %i[edit]
  before_action :set_account, only: %i[edit update reset ]

  # GET /account_settings/edit
  def edit
    authorize! :manage, :account_settings

    @account.company.addresses.build if @account.company.addresses.empty?
  end

  # PATCH/PUT /account_settings or /account_settings/1.json
  def update
    authorize! :manage, :account_settings

    respond_to do |format|
      if @account.update(account_params)
        notice = t('.success')
        format.html { redirect_to root_path, notice: }
        format.json { render :show, status: :ok, location: @account }
        format.turbo_stream { flash.now.notice = notice }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @account.errors, status: :unprocessable_entity }
      end
    end
  end

  def reset
    authorize! :manage, :account_settings

    respond_to do |format|
      if @account.reset
        notice = t('.success')
        format.html { redirect_to root_path, notice: }
        format.json { render :show, status: :ok, location: @account }
        format.turbo_stream { redirect_to root_path, notice: }
      else
        alert = t('error')
        format.html { redirect_to root_path, alert: }
        format.json { render json: operations.errors, status: :unprocessable_entity }
        format.turbo_stream { redirect_back_or_to root_path, alert: }
      end
    end
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_account
    @account = Current.account
  end

  # Only allow a list of trusted parameters through.
  def account_params
    addresses_attributes = %i[id country state city address_line1 address_line2 district postcode]
    company_attributes = [
      :id, :name, :sector_activity_id, :name_natural, :document_1, :document_1_natural, :document_2, :email, :phone_number, :description, :avatar, :logo,
      { addresses_attributes:, company_economic_activities_attributes: %i[id economic_activity_id] }
    ]

    params.require(:account).permit(
      :default_currency,
      :country_code,
      :processor_plan_id,
      :invoice_number_starts_at,
      :invoice_due_days,
      :invoice_tax_percentage,
      :invoice_tax_already_applied,
      { company_attributes: }
    )
  end
end
