# frozen_string_literal: true

module Api
  module V1
    class TransactionsController < ApplicationController
      before_action :set_transaction, only: [:show, :update, :destroy]
      def index
        @transactions = Current.account.transactions
          .includes(:category, :cost_center, :contact, :bank_account)
          .order(created_at: :desc)

        if params[:search].present?
          @transactions = @transactions.search_by_q(params[:search])
        end

        if params[:transaction_type].present?
          transaction_type_cd = Transaction.transaction_types[params[:transaction_type].to_sym]
          @transactions = @transactions.where(transaction_type_cd: transaction_type_cd) if transaction_type_cd
        end

        date_column = { 'competency' => 'competency_date', 'payment' => 'COALESCE(paid_at, due_date)' }
                        .fetch(params[:date_type].to_s, 'due_date')

        if params[:start_date].present?
          start_date = Date.parse(params[:start_date]) rescue nil
          @transactions = @transactions.where("#{date_column} >= ?", start_date) if start_date
        end

        if params[:end_date].present?
          end_date = Date.parse(params[:end_date]) rescue nil
          @transactions = @transactions.where("#{date_column} <= ?", end_date) if end_date
        end

        if params[:category_ids].present?
          category_ids = Array(params[:category_ids]).reject(&:blank?)
          @transactions = @transactions.where(category_id: category_ids) if category_ids.any?
        end

        if params[:cost_center_ids].present?
          cost_center_ids = Array(params[:cost_center_ids]).reject(&:blank?).map { |i| i == '-1' ? nil : i }
          @transactions = @transactions.where(cost_center_id: cost_center_ids) if cost_center_ids.any?
        end

        if params[:bank_account_ids].present?
          bank_account_ids = Array(params[:bank_account_ids]).reject(&:blank?)
          @transactions = @transactions.where(bank_account_id: bank_account_ids) if bank_account_ids.any?
        end

        if params[:contact_ids].present?
          contact_ids = Array(params[:contact_ids]).reject(&:blank?)
          @transactions = @transactions.where(contact_id: contact_ids) if contact_ids.any?
        end

        if params[:payment_methods].present?
          payment_methods = Array(params[:payment_methods]).reject(&:blank?).map(&:to_i)
          @transactions = @transactions.where(payment_method_cd: payment_methods) if payment_methods.any?
        end

        if params[:payment_types].present?
          payment_types = Array(params[:payment_types]).reject(&:blank?).map(&:to_i)
          @transactions = @transactions.where(payment_type_cd: payment_types) if payment_types.any?
        end

        if params[:paid].present?
          raw = Array(params[:paid])
          if raw.include?('__none__')
            @transactions = @transactions.none
          else
            paid_values = raw.map { |p| p.to_s == 'true' || p == true }
            @transactions = @transactions.where(paid: paid_values) if paid_values.any?
          end
        end

        if params[:tag_ids].present?
          tag_ids = Array(params[:tag_ids]).reject(&:blank?)
          @transactions = @transactions.joins(:tags).where(tags: { id: tag_ids }).distinct if tag_ids.any?
        end

        @transactions = @transactions.page(params[:page]).per(params[:per_page] || 20)

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
        if payment_plan_params.present?
          result = Transactions::CreateWithPaymentPlan.call(
            account: Current.account,
            name: transaction_params[:name] || transaction_params[:description] || '',
            description: transaction_params[:description],
            amount_cents: transaction_params[:amount_cents],
            amount_currency: transaction_params[:amount_currency] || 'BRL',
            transaction_type_cd: transaction_params[:transaction_type_cd] || 0,
            due_date: transaction_params[:due_date],
            paid_at: transaction_params[:paid_at],
            category_id: transaction_params[:category_id],
            cost_center_id: transaction_params[:cost_center_id],
            contact_id: transaction_params[:contact_id],
            bank_account_id: transaction_params[:bank_account_id],
            payment_method_cd: transaction_params[:payment_method_cd] || 0,
            paid: transaction_params[:paid] || false,
            competency_date: transaction_params[:competency_date],
            document_number: transaction_params[:document_number],
            payment_plan_type: payment_plan_params[:type] || 'installment',
            amount_type: payment_plan_params[:amount_type] || 'total_amount',
            number_of_installments: payment_plan_params[:number_of_installments].to_i,
            frequency: payment_plan_params[:frequency] || 'monthly'
          )

          if result.success?
            @transaction = result.transaction

            if @transaction.paid? && @transaction.bank_account.present?
              begin
                @transaction.bank_account.update_balance!
                @transaction.bank_account.reload
              rescue => e
                Rails.logger.error "❌ [TransactionsController#create] Erro ao atualizar saldo: #{e.message}"
              end
            end

            render json: {
              transaction: @transaction.as_json(
                include: [:category, :cost_center, :contact, :payment_plan],
                methods: [:formatted_amount, :formatted_due_date, :formatted_paid_at, :transaction_type_name]
              ),
              installments: result.payment_plan.transactions.order(:installment_number).as_json(
                include: [:category, :cost_center, :contact],
                methods: [:formatted_amount, :formatted_due_date, :formatted_paid_at]
              )
            }, status: :created
          else
            render json: {
              errors: [result.message],
              error: result.message
            }, status: :unprocessable_entity
          end
        else
          @transaction = Current.account.transactions.build(transaction_params)
          @transaction.name = @transaction.description if @transaction.name.blank? && @transaction.description.present?

          if @transaction.exchanged_amount_cents.zero? && @transaction.amount_cents.present?
            @transaction.exchanged_amount = @transaction.amount
          end

          if @transaction.save
            if @transaction.paid? && @transaction.bank_account.present?
              begin
                @transaction.bank_account.update_balance!
                @transaction.bank_account.reload
              rescue => e
                Rails.logger.error "❌ [TransactionsController#create] Erro ao atualizar saldo: #{e.message}"
              end
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
      end

      def update
        params_hash = transaction_params.to_h
        params_hash[:name] = params_hash[:description] if params_hash[:name].blank? && params_hash[:description].present?

        old_bank_account_id = @transaction.bank_account_id
        old_paid = @transaction.paid

        if @transaction.update(params_hash)
          accounts_to_update = []
          accounts_to_update << @transaction.bank_account if @transaction.bank_account.present? && @transaction.paid?
          accounts_to_update << BankAccount.find_by(id: old_bank_account_id) if old_bank_account_id.present? && old_bank_account_id != @transaction.bank_account_id

          if old_paid != @transaction.paid
            accounts_to_update << BankAccount.find_by(id: old_bank_account_id) if old_bank_account_id.present?
          end

          accounts_to_update.compact.uniq.each do |account|
            begin
              account.update_balance!
              account.reload
            rescue => e
              Rails.logger.error "❌ [TransactionsController#update] Erro ao atualizar conta #{account.id}: #{e.message}"
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

        @transaction.destroy

        if was_paid && bank_account_id.present?
          bank_account = BankAccount.find_by(id: bank_account_id)
          if bank_account.present?
            begin
              bank_account.update_balance!
              bank_account.reload
            rescue => e
              Rails.logger.error "❌ [TransactionsController#destroy] Erro ao atualizar conta #{bank_account_id}: #{e.message}"
            end
          end
        end

        head :no_content
      end

      def check_recurrence_expiry
        result = Transactions::CheckRecurrenceExpiry.call(account: Current.account)

        if result.success?
          render json: {
            expiring_recurrences: result.expiring_recurrences.map do |item|
              {
                payment_plan_id: item[:payment_plan_id],
                description: item[:last_transaction].description || item[:last_transaction].name,
                last_due_date: item[:last_due_date],
                months_remaining: item[:months_remaining],
                frequency: item[:payment_plan].frequency,
                amount_cents: item[:last_transaction].amount_cents
              }
            end
          }
        else
          render json: { error: result.message }, status: :unprocessable_entity
        end
      end

      def extend_recurrence
        payment_plan_id = params[:payment_plan_id] || params.dig(:payment_plan, :id)
        payment_plan = Current.account.payment_plans.find(payment_plan_id)

        result = Transactions::ExtendRecurrence.call(
          account: Current.account,
          payment_plan: payment_plan
        )

        if result.success?
          render json: {
            message: result.message,
            payment_plan: payment_plan.reload.as_json(include: [:transactions])
          }
        else
          render json: { error: result.message }, status: :unprocessable_entity
        end
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

      def payment_plan_params
        return nil unless params[:payment_plan].present?

        params.require(:payment_plan).permit(
          :type, :amount_type, :number_of_installments, :frequency
        )
      end
    end
  end
end
