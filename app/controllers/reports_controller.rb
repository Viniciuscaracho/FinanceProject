# frozen_string_literal: true

class ReportsController < ApplicationController
  def index
    # Dados mock para relatórios
    @reports = [
      OpenStruct.new(
        id: 1,
        name: "Relatório de Receitas",
        type: "income",
        period: "Janeiro 2025",
        total: 45000.00,
        status: "completed"
      ),
      OpenStruct.new(
        id: 2,
        name: "Relatório de Despesas",
        type: "expense",
        period: "Janeiro 2025",
        total: 28000.00,
        status: "completed"
      ),
      OpenStruct.new(
        id: 3,
        name: "Relatório de Fluxo de Caixa",
        type: "cash_flow",
        period: "Janeiro 2025",
        total: 17000.00,
        status: "pending"
      )
    ]
    
    render layout: 'views_v2/layouts/application'
  end

  def show
    @report = OpenStruct.new(
      id: params[:id],
      name: "Relatório de Receitas",
      type: "income",
      period: "Janeiro 2025",
      total: 45000.00,
      status: "completed",
      created_at: Date.current - 5.days,
      data: {
        "Vendas" => 30000.00,
        "Serviços" => 12000.00,
        "Licenciamentos" => 3000.00
      }
    )
    
    render layout: 'views_v2/layouts/application'
  end

  def new
    @report = OpenStruct.new
    render layout: 'views_v2/layouts/application'
  end

  def edit
    @report = OpenStruct.new(
      id: params[:id],
      name: "Relatório de Receitas",
      type: "income",
      period: "Janeiro 2025",
      total: 45000.00,
      status: "completed",
      created_at: Date.current - 5.days,
      data: {
        "Vendas" => 30000.00,
        "Serviços" => 12000.00,
        "Licenciamentos" => 3000.00
      }
    )
    render layout: 'views_v2/layouts/application'
  end
end
