# frozen_string_literal: true

module BarberManagement
  module AbacatePay
    # Fluxo v2:
    # 1. find-or-create produto no AbacatePay (por externalId = plan_id)
    # 2. criar checkout com o id do produto retornado
    class CreateBilling < ApplicationService
      def call
        validate_configuration!
        validate_params!

        product_id = ensure_product_exists!
        checkout   = create_checkout!(product_id)

        pix_billing = context.account.pix_billings.create!(
          billing_id:  checkout['id'],
          billing_url: checkout['url'],
          amount:      checkout['amount'],
          status:      checkout['status'] || 'PENDING',
          frequency:   context.frequency || 'ONE_TIME',
          plan_id:     context.plan_id,
          plan_name:   context.plan_name,
          metadata:    checkout
        )

        context.pix_billing = pix_billing
        context.billing_url = pix_billing.billing_url

        Rails.logger.info "AbacatePay: checkout criado #{pix_billing.billing_id} para account #{context.account.id}"
      rescue AbacatePayError => e
        Rails.logger.error "AbacatePay API error: #{e.message}"
        context.fail!(error: e.message)
      rescue StandardError => e
        Rails.logger.error "AbacatePay erro inesperado: #{e.message}\n#{e.backtrace.first(3).join("\n")}"
        context.fail!(error: "Erro ao criar cobrança PIX: #{e.message}")
      end

      private

      def validate_configuration!
        unless Client.configured?
          context.fail!(error: 'AbacatePay não está configurado. Defina ABACATE_PAY_API_KEY nas credenciais.')
        end
      end

      def validate_params!
        context.fail!(error: 'Account é obrigatório')    unless context.account.present?
        context.fail!(error: 'amount é obrigatório')     unless context.amount.to_i > 0
        context.fail!(error: 'plan_name é obrigatório')  unless context.plan_name.present?
      end

      # Busca produto existente (pelo externalId) ou cria um novo.
      # Retorna o id interno do AbacatePay.
      def ensure_product_exists!
        external_id = context.plan_id.presence || "barber_#{context.amount}"

        products = Client.get('/products/list')
        existing = Array(products).find { |p| p['externalId'] == external_id }
        return existing['id'] if existing

        product = Client.post('/products/create', body: {
          externalId:  external_id,
          name:        context.plan_name,
          description: context.plan_description.presence || context.plan_name,
          price:       context.amount.to_i,
          quantity:    1,
          currency:    'BRL'
        })
        product['id']
      end

      def create_checkout!(product_id)
        account = context.account
        company = account.company
        owner   = account.owner
        tax_id  = company.document_1.presence || company.document_2.presence

        Client.post('/checkouts/create', body: {
          items:         [{ id: product_id, quantity: 1 }],
          methods:       ['PIX'],
          frequency:     context.frequency.presence || 'ONE_TIME',
          returnUrl:     return_url,
          completionUrl: completion_url,
          customer: {
            name:      company.name || owner.name,
            email:     company.email || owner.email,
            cellphone: (company.phone_number || owner.phone_number)&.gsub(/\D/, ''),
            tax_id:    tax_id
          }.compact
        })
      end

      def return_url
        frontend_url = ENV.fetch('FRONTEND_URL', 'http://localhost:5173')
        "#{frontend_url}/subscription?pix_return=true"
      end

      def completion_url
        frontend_url = ENV.fetch('FRONTEND_URL', 'http://localhost:5173')
        "#{frontend_url}/subscription?pix_success=true"
      end
    end
  end
end
