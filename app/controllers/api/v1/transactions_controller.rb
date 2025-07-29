# frozen_string_literal: true

module Api
  module V1
    class TransactionsController < ApplicationController
      before_action :set_transaction, only: [:show, :update, :destroy]
      skip_before_action :authenticate_user!, only: [:public_test]
      skip_before_action :set_current_account, only: [:public_test]
      
      def index
        @transactions = Current.account.transactions
          .includes(:category, :cost_center, :contact)
          .order(created_at: :desc)
          .page(params[:page])
          .per(params[:per_page] || 20)
        
        render json: {
          transactions: @transactions.as_json(
            include: [:category, :cost_center, :contact],
            methods: [:formatted_amount, :formatted_due_date, :formatted_paid_at, :transaction_type_name]
          ),
          meta: {
            current_page: @transactions.current_page,
            total_pages: @transactions.total_pages,
            total_count: @transactions.total_count
          }
        }
      end
      
      def show
        render json: @transaction.as_json(
          include: [:category, :cost_center, :contact],
          methods: [:formatted_amount, :formatted_due_date, :formatted_paid_at, :transaction_type_name]
        )
      end
      
      def create
        @transaction = Current.account.transactions.build(transaction_params)
        
        if @transaction.save
          render json: @transaction.as_json(
            include: [:category, :cost_center, :contact],
            methods: [:formatted_amount, :formatted_due_date, :formatted_paid_at, :transaction_type_name]
          ), status: :created
        else
          render json: { errors: @transaction.errors.full_messages }, status: :unprocessable_entity
        end
      end
      
      def update
        if @transaction.update(transaction_params)
          render json: @transaction.as_json(
            include: [:category, :cost_center, :contact],
            methods: [:formatted_amount, :formatted_due_date, :formatted_paid_at, :transaction_type_name]
          )
        else
          render json: { errors: @transaction.errors.full_messages }, status: :unprocessable_entity
        end
      end
      
      def destroy
        @transaction.destroy
        head :no_content
      end

      # Endpoint de teste temporário
      def test
        render json: {
          message: "API funcionando!",
          timestamp: Time.current,
          account: Current.account&.id,
          transactions_count: Current.account&.transactions&.count || 0
        }
      end

      # Endpoint público para teste
      def public_test
        render json: {
          message: "API pública funcionando!",
          timestamp: Time.current,
          status: "OK"
        }
      end
      
      private
      
      def set_transaction
        @transaction = Current.account.transactions.find(params[:id])
      end
      
      def transaction_params
        params.require(:transaction).permit(
          :description, :amount_cents, :amount_currency, :exchanged_amount_cents, :exchanged_amount_currency,
          :transaction_type_cd, :due_date, :paid_at, :category_id, :cost_center_id, :contact_id, :bank_account_id,
          :paid, :payment_method_cd, :payment_type_cd, :competency_date, :name, :transfer_to_id,
          :installment_number, :installment_total, :installment_type_cd, :document_number
        )
      end
    end
  end
end
