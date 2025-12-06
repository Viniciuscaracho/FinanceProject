# frozen_string_literal: true

module Api
  module V1
    class BankAccountsController < ApplicationController
      before_action :set_bank_account, only: [:show, :update, :destroy]

      def index
        Rails.logger.info "🏦 [BankAccountsController#index] Iniciando busca de contas bancárias para account_id=#{Current.account.id}"
        
        @bank_accounts = Current.account.bank_accounts
          .order(created_at: :desc)
          .page(params[:page])
          .per(params[:per_page] || 20)

        Rails.logger.info "🏦 [BankAccountsController#index] Encontradas #{@bank_accounts.count} contas bancárias"

        render json: {
          bank_accounts: @bank_accounts.map do |account|
            Rails.logger.info "💰 [BankAccountsController#index] Processando conta ID=#{account.id}, name=#{account.name}"
            
            # Verificar transações antes de atualizar
            paid_transactions = account.transactions.where(paid: true)
            all_transactions = account.transactions
            Rails.logger.info "💰 [BankAccountsController#index] Conta #{account.id}: total_transactions=#{all_transactions.count}, paid_transactions=#{paid_transactions.count}"
            
            # Calcular saldo manualmente para debug (sem atualizar)
            Rails.logger.info "💰 [BankAccountsController#index] Conta #{account.id}: initial_balance_cents=#{account.initial_balance_cents}, current_balance_cents=#{account.balance_cents}"
            
            # Sempre recalcular o saldo antes de retornar para garantir que está atualizado
            begin
              account.update_balance!
              account.reload
              balance_cents = account.balance_cents || 0
              Rails.logger.info "✅ [BankAccountsController#index] Conta #{account.id} atualizada: balance_cents=#{balance_cents}"
            rescue => e
              Rails.logger.error "❌ [BankAccountsController#index] Erro ao atualizar saldo da conta #{account.id}: #{e.message}"
              Rails.logger.error e.backtrace.join("\n")
              balance_cents = account.balance_cents || 0
            end
            
            account.as_json.merge(
              balance: balance_cents / 100.0,
              balance_cents: balance_cents,
              initial_balance: account.initial_balance_cents / 100.0
            )
          end,
          meta: {
            current_page: @bank_accounts.current_page,
            total_pages: @bank_accounts.total_pages,
            total_count: @bank_accounts.total_count
          }
        }
      rescue => e
        Rails.logger.error "❌ [BankAccountsController#index] ERRO FATAL: #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
        raise
      end

      def show
        render json: { bank_account: @bank_account.as_json }
      end

      def create
        @bank_account = Current.account.bank_accounts.build(bank_account_params)

        if @bank_account.save
          render json: { bank_account: @bank_account.as_json }, status: :created
        else
          render json: { errors: @bank_account.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @bank_account.update(bank_account_params)
          render json: { bank_account: @bank_account.as_json }
        else
          render json: { errors: @bank_account.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @bank_account.destroy
        render json: { message: 'Conta bancária removida com sucesso' }
      end

      def balance
        # Calcular saldo total baseado nas transações
        total_balance = Current.account.transactions.sum(:amount_cents) / 100.0
        
        render json: {
          balance: total_balance,
          currency: 'BRL',
          last_updated: Time.current
        }
      end

      private

      def set_bank_account
        @bank_account = Current.account.bank_accounts.find(params[:id])
      end

      def bank_account_params
        params.require(:bank_account).permit(:name, :account_number, :bank_name, :balance)
      end
    end
  end
end
