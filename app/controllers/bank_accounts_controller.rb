# frozen_string_literal: true

class BankAccountsController < ApplicationController
  before_action :set_bank_account, only: %i[show edit update destroy turn_default archive unarchive]

  # GET /bank_accounts
  def index
    authorize! :read, BankAccount

    query = current_account.bank_accounts
    query = query.sort_by_params(sort_column(BankAccount, default: :discarded_at), sort_direction(default: :desc))
    query = query.search_by_q(params[:q]) if params[:q].present?

    @pagy, @records = pagy(query)

    @records.load
  end

  # GET /bank_accounts/1 or /bank_accounts/1.json
  def show; end

  # GET /bank_accounts/new
  def new
    authorize! :create, BankAccount

    @bank_account = BankAccount.new
  end

  # GET /bank_accounts/1/edit
  def edit; end

  # POST /bank_accounts or /bank_accounts.json
  def create
    authorize! :create, BankAccount

    params = bank_account_params.merge(default: false)
    result = BankAccounts::Create.call(account: current_account, bank_account_params: params)

    respond_to do |format|
      @bank_account = result.bank_account
      build_response_format(result:, format:, status: :created)
    end
  end

  # PATCH/PUT /bank_accounts/1/turn_default or /bank_accounts/1/turn_default.json
  def turn_default
    authorize! :update, @bank_account

    @prev_default_bank_account = current_account.default_bank_account

    respond_to do |format|
      result = BankAccounts::TurnDefault.call(
        prev_default_bank_account: @prev_default_bank_account,
        bank_account: @bank_account
      )
      build_response_format(result:, format:)
    end
  end

  def archive
    authorize! :update, @bank_account

    respond_to do |format|
      result = BankAccounts::Archive.call(bank_account: @bank_account)
      build_response_format(result:, format:)
    end
  end

  def unarchive
    authorize! :update, @bank_account

    respond_to do |format|
      result = BankAccounts::Unarchive.call(bank_account: @bank_account)
      build_response_format(result:, format:)
    end

  end

  # PATCH/PUT /bank_accounts/1 or /bank_accounts/1.json
  def update
    authorize! :update, @bank_account

    respond_to do |format|
      result = BankAccounts::Update.call(bank_account: @bank_account, bank_account_params:)
      build_response_format(result:, format:)
    end
  end

  # DELETE /bank_accounts/1 or /bank_accounts/1.json
  def destroy
    authorize! :destroy, @bank_account

    respond_to do |format|
      result = BankAccounts::Destroy.call(bank_account: @bank_account)
      if result.success?
        flash.now.notice = result.message
        format.html { redirect_to bank_accounts_url }
        format.json { head :no_content }
        format.turbo_stream { flash.now.notice = notice }
      else
        flash.now.alert = result.message
        format.turbo_stream { turbo_stream.update :flash, render(FlashComponent.new(flash:)) }
        format.html { redirect_to bank_accounts_url }
        format.json { render json: result.message, status: :unprocessable_entity }
      end
    end
  end

  private

  def build_response_format(result:, format:, status: :ok)
    if result.success?
      notice = result.message
      format.html { redirect_to bank_accounts_url, notice: }
      format.json { render :show, status:, location: @bank_account }
      format.turbo_stream { flash.now.notice = notice }
    else
      format.html { render :edit, status: :unprocessable_entity }
      format.json { render json: @bank_account.errors, status: :unprocessable_entity }
    end
  end

  # Use callbacks to share common setup or constraints between actions.
  def set_bank_account
    @bank_account = current_account.bank_accounts.find(params[:id])
  end

  # Only allow a list of trusted parameters through.
  def bank_account_params
    params.require(:bank_account).permit(:name, :account_type, :balance_cents, :balance_currency,
                                         :initial_balance_cents, :initial_balance_currency, :default, :agency, :account_number, :bank_id)
  end
end
