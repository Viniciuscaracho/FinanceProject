# frozen_string_literal: true

class StatementsController < ApplicationController
  def index
    # Dados mock para extratos
    @statements = [
      OpenStruct.new(
        id: 1,
        name: "Extrato Conta Principal",
        account: "Conta Principal",
        period: "01/07/2025 - 31/07/2025",
        status: "completed",
        balance: 15420.00,
        created_at: Date.current - 5.days
      ),
      OpenStruct.new(
        id: 2,
        name: "Extrato Caixa",
        account: "Caixa",
        period: "01/07/2025 - 31/07/2025",
        status: "completed",
        balance: 8750.00,
        created_at: Date.current - 3.days
      ),
      OpenStruct.new(
        id: 3,
        name: "Extrato Conta Poupança",
        account: "Conta Poupança",
        period: "01/07/2025 - 31/07/2025",
        status: "pending",
        balance: 25800.00,
        created_at: Date.current - 1.day
      )
    ]
    
    render layout: 'views_v2/layouts/application'
  end

  def show
    @statement = OpenStruct.new(
      id: params[:id],
      name: "Extrato Conta Principal",
      account: "Conta Principal",
      period: "01/07/2025 - 31/07/2025",
      status: "completed",
      balance: 15420.00,
      created_at: Date.current - 5.days,
      items: [
        OpenStruct.new(
          date: Date.current - 5.days,
          description: "Venda de produtos",
          amount: 1500.00,
          type: "revenue"
        ),
        OpenStruct.new(
          date: Date.current - 4.days,
          description: "Pagamento de aluguel",
          amount: -800.00,
          type: "expense"
        )
      ]
    )
    
    render layout: 'views_v2/layouts/application'
  end

  def new
    @statement = OpenStruct.new
    render layout: 'views_v2/layouts/application'
  end

  def edit
    @statement = OpenStruct.new(
      id: params[:id],
      name: "Extrato Conta Principal",
      account: "Conta Principal",
      period: "01/07/2025 - 31/07/2025",
      status: "completed",
      balance: 15420.00,
      created_at: Date.current - 5.days
    )
    render layout: 'views_v2/layouts/application'
  end
end
