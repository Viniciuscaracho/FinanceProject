# frozen_string_literal: true

module Api
  module V1
    class BankAccountsController < ApplicationController
      before_action :set_bank_account, only: [:show, :update, :destroy]

      def index
        @bank_accounts = Current.account.bank_accounts
          .order(created_at: :desc)
          .page(params[:page])
          .per(params[:per_page] || 20)

        render json: {
          bank_accounts: @bank_accounts.as_json,
          meta: {
            current_page: @bank_accounts.current_page,
            total_pages: @bank_accounts.total_pages,
            total_count: @bank_accounts.total_count
          }
        }
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
