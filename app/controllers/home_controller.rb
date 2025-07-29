# frozen_string_literal: true

class HomeController < ApplicationController
  def index
    # Dados reais para o dashboard (com autenticação)
    @recent_transactions = Current.account.transactions.limit(5).order(created_at: :desc) if Current.account
    @current_month = Date.current
    
    # Calcular dados para o dashboard
    if Current.account
      @total_balance = Current.account.transactions.sum(:amount)
      @total_income = Current.account.transactions.where('amount > 0').sum(:amount)
      @total_expenses = Current.account.transactions.where('amount < 0').sum(:amount).abs
      @total_transactions = Current.account.transactions.count
      @total_contacts = Current.account.contacts.count
      
      # Calcular crescimento
      @balance_change = calculate_balance_change
      @income_growth = calculate_income_growth
      @expenses_growth = calculate_expenses_growth
      @savings_rate = calculate_savings_rate
    else
      @total_balance = @total_income = @total_expenses = @total_transactions = @total_contacts = 0
      @balance_change = @income_growth = @expenses_growth = @savings_rate = 0
    end
    
    # Renderizar o novo layout se solicitado
    if params[:new_design]
      render layout: 'views_v2/layouts/application'
    end
  end

  def calendar
    @current_month = Date.current
    # ... outros códigos do método calendar, se houver ...
  end

  private

  def calculate_balance_change
    return 0 unless Current.account
    
    current_month = Current.account.transactions.where(created_at: Time.current.beginning_of_month..Time.current.end_of_month).sum(:amount)
    last_month = Current.account.transactions.where(created_at: 1.month.ago.beginning_of_month..1.month.ago.end_of_month).sum(:amount)
    
    return 0 if last_month.zero?
    
    ((current_month - last_month) / last_month * 100).round(1)
  end

  def calculate_income_growth
    return 0 unless Current.account
    
    current_month = Current.account.transactions.where('amount > 0').where(created_at: Time.current.beginning_of_month..Time.current.end_of_month).sum(:amount)
    last_month = Current.account.transactions.where('amount > 0').where(created_at: 1.month.ago.beginning_of_month..1.month.ago.end_of_month).sum(:amount)
    
    return 0 if last_month.zero?
    
    ((current_month - last_month) / last_month * 100).round(1)
  end

  def calculate_expenses_growth
    return 0 unless Current.account
    
    current_month = Current.account.transactions.where('amount < 0').where(created_at: Time.current.beginning_of_month..Time.current.end_of_month).sum(:amount).abs
    last_month = Current.account.transactions.where('amount < 0').where(created_at: 1.month.ago.beginning_of_month..1.month.ago.end_of_month).sum(:amount).abs
    
    return 0 if last_month.zero?
    
    ((current_month - last_month) / last_month * 100).round(1)
  end

  def calculate_savings_rate
    return 0 unless Current.account
    
    income = Current.account.transactions.where('amount > 0').sum(:amount)
    expenses = Current.account.transactions.where('amount < 0').sum(:amount).abs
    
    return 0 if income.zero?
    
    ((income - expenses) / income * 100).round(1)
  end


end
