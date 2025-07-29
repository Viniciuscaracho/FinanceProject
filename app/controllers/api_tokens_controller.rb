# frozen_string_literal: true

class ApiTokensController < ApplicationController

  def index
    authorize! :read, ApiToken
    @api_tokens = current_account.api_tokens.order(created_at: :desc)
  end

  def new
    authorize! :create, ApiToken
    @api_token = current_account.api_tokens.new
  end

  def create
    authorize! :create, ApiToken
    @api_token = ApiToken.new(api_token_params)

    @api_token.account = current_account
    @api_token.user = current_user

    respond_to do |format|
      if @api_token.save
        notice = t('.success')
        format.html { redirect_to api_tokens_path, notice: 'Api token was successfully created.' }
        format.turbo_stream { flash.now.notice = notice }
      else
        alert = t('.error')
        format.html { render :new }
        format.turbo_stream { flash.now.alert = alert }
      end
    end
  end

  def edit
    authorize! :edit, ApiToken
    @api_token = current_account.api_tokens.find(params[:id])
  end

  def update
    authorize! :edit, ApiToken
    @api_token = current_account.api_tokens.find(params[:id])

    respond_to do |format|
      if @api_token.update(api_token_params)
        notice = t('.success')
        format.html { redirect_to api_tokens_path, notice: 'Api token was successfully updated.' }
        format.turbo_stream { flash.now.notice = notice }
      else
        alert = t('.error')
        format.html { render :edit, status: :unprocessable_entity }
        format.turbo_stream { flash.now.alert = alert }
      end
    end
  end

  def destroy
    authorize! :destroy, ApiToken
    @api_token = current_account.api_tokens.find(params[:id])
    @api_token.destroy
    @api_tokens = current_account.api_tokens

    respond_to do |format|
      notice = t('.success')
      format.html { redirect_to api_tokens_path, notice: 'Api token was successfully destroyed.' }
      format.turbo_stream { flash.now.notice = notice }
    end
  end

  private

  def api_token_params
    params.require(:api_token).permit(:name, :description, :expires_at)
  end
end
