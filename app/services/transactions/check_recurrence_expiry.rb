# frozen_string_literal: true

module Transactions
  # Serviço para verificar se uma recorrência está próxima do fim
  class CheckRecurrenceExpiry < ApplicationService
    # Verificar recorrências que estão nos últimos 2 meses
    MONTHS_BEFORE_EXPIRY = 2

    def call
      recurring_payment_plans = Current.account.payment_plans
                                         .where(type_cd: PaymentPlan::TYPES[:recurring])
                                         .includes(:transactions)

      expiring_soon = []

      recurring_payment_plans.each do |payment_plan|
        last_transaction = payment_plan.transactions.order(:due_date).last
        next unless last_transaction

        # Calcular quantos meses faltam até o fim
        months_remaining = calculate_months_until_date(last_transaction.due_date)

        if months_remaining <= MONTHS_BEFORE_EXPIRY
          expiring_soon << {
            payment_plan_id: payment_plan.id,
            payment_plan: payment_plan,
            last_transaction: last_transaction,
            months_remaining: months_remaining,
            last_due_date: last_transaction.due_date
          }
        end
      end

      context.expiring_recurrences = expiring_soon
    end

    private

    def calculate_months_until_date(target_date)
      today = Date.current
      return 0 if target_date <= today
      
      # Calcular diferença em meses
      months = (target_date.year - today.year) * 12 + (target_date.month - today.month)
      
      # Ajustar se o dia do mês ainda não chegou
      months -= 1 if target_date.day < today.day
      
      months
    end
  end
end

