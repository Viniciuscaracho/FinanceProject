# frozen_string_literal: true

module Api
  module V1
    class PaymentPlansController < ApplicationController
      before_action :set_payment_plan, only: [:installments, :update_installments]

      # Endpoint para buscar parcelas de um payment_plan
      def installments
        installments = @payment_plan.transactions.order(:installment_number).as_json(
          include: [:category, :cost_center, :contact, :bank_account],
          methods: [:formatted_amount, :formatted_due_date, :formatted_paid_at]
        )
        
        render json: {
          payment_plan: @payment_plan.as_json,
          installments: installments
        }
      end

      # Endpoint para atualizar parcelas em lote
      def update_installments
        ApplicationRecord.transaction do
          updated_installments = []
          errors = []
          
          params[:installments].each do |installment_params|
            installment = @payment_plan.transactions.find(installment_params[:id])
            
            if installment
              # Converter valores
              installment_data = {
                amount_cents: installment_params[:amount_cents] ? (installment_params[:amount_cents].to_f * 100).to_i : installment.amount_cents,
                due_date: installment_params[:due_date] || installment.due_date,
                paid: installment_params[:paid] != nil ? installment_params[:paid] : installment.paid,
                paid_at: installment_params[:paid] ? (installment_params[:paid_at] || Time.current) : nil,
                description: installment_params[:description] || installment.description,
                name: installment_params[:name] || installment.name,
                category_id: installment_params[:category_id] || installment.category_id,
                cost_center_id: installment_params[:cost_center_id] || installment.cost_center_id,
                contact_id: installment_params[:contact_id] || installment.contact_id,
                bank_account_id: installment_params[:bank_account_id] || installment.bank_account_id
              }
              
              if installment.update(installment_data)
                updated_installments << installment.reload.as_json(
                  include: [:category, :cost_center, :contact, :bank_account],
                  methods: [:formatted_amount, :formatted_due_date, :formatted_paid_at]
                )
              else
                errors << { id: installment.id, errors: installment.errors.full_messages }
              end
            else
              errors << { id: installment_params[:id], errors: ['Parcela não encontrada'] }
            end
          end
          
          if errors.any?
            render json: { 
              errors: errors,
              updated_installments: updated_installments
            }, status: :unprocessable_entity
          else
            # Atualizar saldo das contas bancárias afetadas
            bank_account_ids = updated_installments.map { |i| i['bank_account_id'] }.compact.uniq
            bank_account_ids.each do |account_id|
              account = BankAccount.find_by(id: account_id)
              account&.update_balance!
            end
            
            render json: {
              message: 'Parcelas atualizadas com sucesso',
              installments: updated_installments
            }
          end
        end
      rescue => e
        Rails.logger.error "Erro ao atualizar parcelas: #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
        render_internal_error(e, status: :unprocessable_entity)
      end

      private

      def set_payment_plan
        @payment_plan = Current.account.payment_plans.find(params[:id])
      end
    end
  end
end

