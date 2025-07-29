# frozen_string_literal: true

class IntegrationsController < ApplicationController
  def index
    # Dados mock para integrações
    @integrations = [
      OpenStruct.new(
        id: 1,
        name: "Nuvem Fiscal",
        type: "Emissão de NFe",
        status: "active",
        last_sync: Date.current - 1.hour,
        description: "Integração com emissão de notas fiscais"
      ),
      OpenStruct.new(
        id: 2,
        name: "Pluggy",
        type: "Open Banking",
        status: "active",
        last_sync: Date.current - 2.hours,
        description: "Integração com bancos"
      ),
      OpenStruct.new(
        id: 3,
        name: "Stripe",
        type: "Pagamentos",
        status: "active",
        last_sync: Date.current - 30.minutes,
        description: "Processamento de pagamentos"
      ),
      OpenStruct.new(
        id: 4,
        name: "WhatsApp Business",
        type: "Comunicação",
        status: "pending",
        last_sync: nil,
        description: "Integração com WhatsApp"
      )
    ]
    
    render layout: 'views_v2/layouts/application'
  end

  def show
    @integration = OpenStruct.new(
      id: params[:id],
      name: "Nuvem Fiscal",
      type: "Emissão de NFe",
      status: "active",
      last_sync: Date.current - 1.hour,
      description: "Integração com emissão de notas fiscais",
      config: {
        "api_key" => "sk_test_123456789",
        "environment" => "production",
        "webhook_url" => "https://api.nuvemfiscal.com.br/webhook"
      }
    )
    
    render layout: 'views_v2/layouts/application'
  end

  def new
    @integration = OpenStruct.new
    render layout: 'views_v2/layouts/application'
  end

  def edit
    @integration = OpenStruct.new(
      id: params[:id],
      name: "Nuvem Fiscal",
      type: "Emissão de NFe",
      status: "active",
      last_sync: Date.current - 1.hour,
      description: "Integração com emissão de notas fiscais",
      config: {
        "api_key" => "sk_test_123456789",
        "environment" => "production",
        "webhook_url" => "https://api.nuvemfiscal.com.br/webhook"
      }
    )
    render layout: 'views_v2/layouts/application'
  end
end 