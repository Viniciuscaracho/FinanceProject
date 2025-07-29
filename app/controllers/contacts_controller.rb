# frozen_string_literal: true

class ContactsController < ApplicationController
  def index
    # Dados reais para contatos (com autenticação)
    @contacts = Current.account.contacts.limit(10).order(created_at: :desc) if Current.account
    
    render layout: 'views_v2/layouts/application'
  end

  def show
    @contact = Current.account.contacts.find(params[:id]) if Current.account
    
    render layout: 'views_v2/layouts/application'
  end

  def new
    @contact = Current.account.contacts.new if Current.account
    render layout: 'views_v2/layouts/application'
  end

  def edit
    @contact = Current.account.contacts.find(params[:id]) if Current.account
    render layout: 'views_v2/layouts/application'
  end
end
