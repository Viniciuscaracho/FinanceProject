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
        
        # Aplicar filtros de busca
        if params[:search].present?
          @transactions = @transactions.search_by_q(params[:search])
        end
        
        # Aplicar filtro de tipo de transação
        if params[:transaction_type].present?
          transaction_type_cd = Transaction.transaction_types[params[:transaction_type].to_sym]
          @transactions = @transactions.where(transaction_type_cd: transaction_type_cd) if transaction_type_cd
        end
        
        # Aplicar filtros de data
        date_column = params[:date_type] == 'competency' ? 'competency_date' : (params[:date_type] == 'payment' ? 'paid_at' : 'due_date')
        if params[:start_date].present?
          start_date = Date.parse(params[:start_date]) rescue nil
          @transactions = @transactions.where("#{date_column} >= ?", start_date) if start_date
        end
        if params[:end_date].present?
          end_date = Date.parse(params[:end_date]) rescue nil
          @transactions = @transactions.where("#{date_column} <= ?", end_date) if end_date
        end
        
        # Aplicar filtro de categorias
        if params[:category_ids].present?
          category_ids = Array(params[:category_ids]).reject(&:blank?)
          @transactions = @transactions.where(category_id: category_ids) if category_ids.any?
        end
        
        # Aplicar filtro de centros de custo
        if params[:cost_center_ids].present?
          cost_center_ids = Array(params[:cost_center_ids]).reject(&:blank?).map { |i| i == '-1' ? nil : i }
          @transactions = @transactions.where(cost_center_id: cost_center_ids) if cost_center_ids.any?
        end
        
        # Aplicar filtro de contas bancárias
        if params[:bank_account_ids].present?
          bank_account_ids = Array(params[:bank_account_ids]).reject(&:blank?)
          @transactions = @transactions.where(bank_account_id: bank_account_ids) if bank_account_ids.any?
        end
        
        # Aplicar filtro de contatos
        if params[:contact_ids].present?
          contact_ids = Array(params[:contact_ids]).reject(&:blank?)
          @transactions = @transactions.where(contact_id: contact_ids) if contact_ids.any?
        end
        
        # Aplicar filtro de métodos de pagamento
        if params[:payment_methods].present?
          payment_methods = Array(params[:payment_methods]).reject(&:blank?).map(&:to_i)
          @transactions = @transactions.where(payment_method_cd: payment_methods) if payment_methods.any?
        end
        
        # Aplicar filtro de tipo de pagamento
        if params[:payment_types].present?
          payment_types = Array(params[:payment_types]).reject(&:blank?).map(&:to_i)
          @transactions = @transactions.where(payment_type_cd: payment_types) if payment_types.any?
        end
        
        # Aplicar filtro de status pago
        if params[:paid].present?
          paid_values = Array(params[:paid]).map { |p| p.to_s == 'true' || p == true }
          @transactions = @transactions.where(paid: paid_values) if paid_values.any?
        end
        
        # Aplicar filtro de tags
        if params[:tag_ids].present?
          tag_ids = Array(params[:tag_ids]).reject(&:blank?)
          @transactions = @transactions.joins(:tags).where(tags: { id: tag_ids }).distinct if tag_ids.any?
        end
        
        # Paginação
        @transactions = @transactions.page(params[:page]).per(params[:per_page] || 20)
        
        # Renderizar JSON sem métodos de formatação (fazer no frontend para melhor performance)
        render json: {
          transactions: @transactions.as_json(
            include: [:category, :cost_center, :contact],
            only: [:id, :name, :description, :amount_cents, :amount_currency, :transaction_type_cd,
                   :due_date, :paid_at, :paid, :payment_method_cd, :payment_type_cd,
                   :bank_account_id, :category_id, :cost_center_id, :contact_id, :created_at, :updated_at]
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
        
        # Garantir que name seja preenchido se não foi enviado
        @transaction.name = @transaction.description if @transaction.name.blank? && @transaction.description.present?
        
        # Garantir que exchanged_amount seja definido se não foi enviado
        # (o callback set_exchanged_amount deve fazer isso, mas garantimos aqui também)
        if @transaction.exchanged_amount_cents.zero? && @transaction.amount_cents.present?
          @transaction.exchanged_amount = @transaction.amount
        end
        
        if @transaction.save
          Rails.logger.info "💵 [TransactionsController#create] Transação criada: ID=#{@transaction.id}, amount_cents=#{@transaction.amount_cents}, paid=#{@transaction.paid}, bank_account_id=#{@transaction.bank_account_id}"
          
          # Atualizar saldo da conta bancária imediatamente se a transação estiver paga
          if @transaction.paid? && @transaction.bank_account.present?
            Rails.logger.info "💰 [TransactionsController#create] Atualizando saldo da conta #{@transaction.bank_account_id}"
            begin
              old_balance = @transaction.bank_account.balance_cents
              @transaction.bank_account.update_balance!
              @transaction.bank_account.reload
              new_balance = @transaction.bank_account.balance_cents
              Rails.logger.info "✅ [TransactionsController#create] Saldo atualizado: #{old_balance} -> #{new_balance}"
            rescue => e
              Rails.logger.error "❌ [TransactionsController#create] Erro ao atualizar saldo: #{e.message}"
              Rails.logger.error e.backtrace.join("\n")
            end
          else
            Rails.logger.info "⏸️ [TransactionsController#create] Transação não paga ou sem conta bancária, pulando atualização de saldo"
          end
          
          render json: @transaction.as_json(
            include: [:category, :cost_center, :contact],
            methods: [:formatted_amount, :formatted_due_date, :formatted_paid_at, :transaction_type_name]
          ), status: :created
        else
          Rails.logger.error "Transaction validation errors: #{@transaction.errors.full_messages.inspect}"
          render json: { 
            errors: @transaction.errors.full_messages,
            error: @transaction.errors.full_messages.join(', ')
          }, status: :unprocessable_entity
        end
      end
      
      def update
        params_hash = transaction_params.to_h
        
        # Garantir que name seja preenchido se não foi enviado
        if params_hash[:name].blank? && params_hash[:description].present?
          params_hash[:name] = params_hash[:description]
        end
        
        old_bank_account_id = @transaction.bank_account_id
        old_paid = @transaction.paid
        
        Rails.logger.info "💵 [TransactionsController#update] Atualizando transação ID=#{@transaction.id}, old_bank_account_id=#{old_bank_account_id}, old_paid=#{old_paid}"
        
        if @transaction.update(params_hash)
          Rails.logger.info "💵 [TransactionsController#update] Transação atualizada: new_bank_account_id=#{@transaction.bank_account_id}, new_paid=#{@transaction.paid}, amount_cents=#{@transaction.amount_cents}"
          
          # Atualizar saldo das contas afetadas imediatamente
          accounts_to_update = []
          accounts_to_update << @transaction.bank_account if @transaction.bank_account.present? && @transaction.paid?
          accounts_to_update << BankAccount.find_by(id: old_bank_account_id) if old_bank_account_id.present? && old_bank_account_id != @transaction.bank_account_id
          
          # Se mudou de não paga para paga, ou vice-versa, atualizar ambas as contas
          if old_paid != @transaction.paid
            accounts_to_update << BankAccount.find_by(id: old_bank_account_id) if old_bank_account_id.present?
          end
          
          Rails.logger.info "💰 [TransactionsController#update] Atualizando #{accounts_to_update.compact.uniq.count} conta(s)"
          accounts_to_update.compact.uniq.each do |account|
            begin
              old_balance = account.balance_cents
              account.update_balance!
              account.reload
              new_balance = account.balance_cents
              Rails.logger.info "✅ [TransactionsController#update] Conta #{account.id} atualizada: #{old_balance} -> #{new_balance}"
            rescue => e
              Rails.logger.error "❌ [TransactionsController#update] Erro ao atualizar conta #{account.id}: #{e.message}"
              Rails.logger.error e.backtrace.join("\n")
            end
          end
          
          render json: @transaction.as_json(
            include: [:category, :cost_center, :contact],
            methods: [:formatted_amount, :formatted_due_date, :formatted_paid_at, :transaction_type_name]
          )
        else
          Rails.logger.error "Transaction update validation errors: #{@transaction.errors.full_messages.inspect}"
          render json: { 
            errors: @transaction.errors.full_messages,
            error: @transaction.errors.full_messages.join(', ')
          }, status: :unprocessable_entity
        end
      end
      
      def destroy
        bank_account_id = @transaction.bank_account_id
        was_paid = @transaction.paid
        amount_cents = @transaction.amount_cents
        
        Rails.logger.info "🗑️ [TransactionsController#destroy] Deletando transação ID=#{@transaction.id}, bank_account_id=#{bank_account_id}, paid=#{was_paid}, amount_cents=#{amount_cents}"
        
        @transaction.destroy
        
        # Atualizar saldo da conta bancária se a transação estava paga
        if was_paid && bank_account_id.present?
          bank_account = BankAccount.find_by(id: bank_account_id)
          if bank_account.present?
            begin
              old_balance = bank_account.balance_cents
              bank_account.update_balance!
              bank_account.reload
              new_balance = bank_account.balance_cents
              Rails.logger.info "✅ [TransactionsController#destroy] Conta #{bank_account_id} atualizada: #{old_balance} -> #{new_balance}"
            rescue => e
              Rails.logger.error "❌ [TransactionsController#destroy] Erro ao atualizar conta #{bank_account_id}: #{e.message}"
              Rails.logger.error e.backtrace.join("\n")
            end
          else
            Rails.logger.warn "⚠️ [TransactionsController#destroy] Conta bancária #{bank_account_id} não encontrada"
          end
        end
        
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
