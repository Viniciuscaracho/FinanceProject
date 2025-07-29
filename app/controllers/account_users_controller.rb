# frozen_string_literal: true

class AccountUsersController < ApplicationController
  before_action :ensure_frame_response, only: %i[new edit]
  before_action :set_account_user, only: %i[show edit update destroy edit_permissions update_permissions]

  # GET /account_users or /account_users.json
  def index
    authorize! :read, AccountUser

    query = Current.account.account_users.left_joins(user: :avatar_attachment).includes(
      account: :owner
    ).order('first_name ASC, last_name ASC')
    query = query.search_by_q(params[:q]) if params[:q].present?

    @pagy, @records = pagy(query)

    @records.load
  end

  # GET /account_users/1 or /account_users/1.json
  def show; end

  # GET /account_users/new
  def new
    # @account_user = AccountUser.new
  end

  # GET /account_users/1/edit
  def edit
    authorize! :update, @account_user
  end

  def edit_permissions
    authorize! :manage, :permissions

    @account_user.policies = AccountUser::DEFAULT_POLICIES if @account_user.custom? && @account_user.policies.empty?
  end

  # POST /account_users or /account_users.json
  def update_permissions
    authorize! :manage, :permissions

    respond_to do |format|
      if @account_user.update(update_permissions_params)
        notice = t('.success')
        format.html { redirect_to account_users_url, notice: }
        format.json { render :show, status: :created, location: @account_user }
        format.turbo_stream { flash.now.notice = notice }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @account_user.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /account_users/1 or /account_users/1.json
  def update
    authorize! :update, @account_user

    respond_to do |format|
      if @account_user.update(account_user_params)
        notice = t('.success')
        format.html { redirect_to account_users_url, notice: }
        format.json { render :show, status: :ok, location: @account_user }
        format.turbo_stream { flash.now.notice = notice }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @account_user.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /account_users/1 or /account_users/1.json
  def destroy
    @account_user.destroy
    respond_to do |format|
      notice = t('.success')
      format.html { redirect_to account_users_url, notice: }
      format.json { head :no_content }
      format.turbo_stream { flash.now.notice = notice }
    end
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_account_user
    @account_user = current_account.account_users.find(params[:id])
  end

  # Only allow a list of trusted parameters through.
  def account_user_params
    params.require(:account_user).permit(:role)
  end

  def update_permissions_params
    params.require(:account_user).permit(:role, policies: [])
  end
end
