# frozen_string_literal: true

class TransactionsController < ApplicationController
  def index
    # Dados reais para transações (com autenticação)
    @transactions = Current.account.transactions.limit(10).order(created_at: :desc) if Current.account
    
    render json: {
      transactions: @transactions.as_json(include: [:category, :cost_center, :contact]),
      meta: {
        current_page: 1,
        total_pages: 1,
        total_count: @transactions&.count || 0
      }
    }
  end

  def show
    @transaction = Current.account.transactions.find(params[:id]) if Current.account
    
    render json: @transaction.as_json(include: [:category, :cost_center, :contact])
  end

  def new
    @transaction = Current.account.transactions.new if Current.account
    render json: @transaction.as_json
  end

  def edit
    @transaction = Current.account.transactions.find(params[:id]) if Current.account
    render json: @transaction.as_json(include: [:category, :cost_center, :contact])
  end
end
