# frozen_string_literal: true

class AccountsController < ApplicationController
  def index
    # Dados reais para contas (com autenticação)
    @accounts = Current.account.bank_accounts if Current.account
    
    if params[:new_design]
      render layout: 'views_v2/layouts/application'
    end
  end

  def show
    @account = Current.account.bank_accounts.find(params[:id]) if Current.account
    
    if params[:new_design]
      render layout: 'views_v2/layouts/application'
    end
  end

  def new
    @account = Current.account.bank_accounts.new if Current.account
    render layout: 'views_v2/layouts/application' if params[:new_design]
  end

  def edit
    @account = Current.account.bank_accounts.find(params[:id]) if Current.account
    render layout: 'views_v2/layouts/application' if params[:new_design]
  end
end
