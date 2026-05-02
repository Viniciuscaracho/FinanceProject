# frozen_string_literal: true

module Transactions
  # Serviço para criar transação com parcelamento ou recorrência
  class CreateWithPaymentPlan < ApplicationService
    def call
      ApplicationRecord.transaction do
        account = context.account || Current.account
        
        # Para recorrência, sempre usar valor por parcela (installment_amount)
        # Para parcelamento, calcular baseado no amount_type
        is_recurring = context.payment_plan_type.to_sym == :recurring
        
        total_amount_cents = if is_recurring
                              # Recorrência: sempre usar o valor informado como valor por transação
                              context.amount_cents
                            elsif context.amount_type == 'installment_amount'
                              # Parcelamento: se o valor informado é por parcela, multiplicar pelo número de parcelas
                              context.amount_cents * context.number_of_installments
                            else
                              # Parcelamento: se o valor informado é total, usar diretamente
                              context.amount_cents
                            end
        
        # Para recorrência, cada transação tem o mesmo valor
        # Para parcelamento, dividir o total
        installment_amount_cents = if is_recurring
                                     context.amount_cents
                                   else
                                     CalculationsHelper.calculate_amount_cents(
                                       amount_cents: total_amount_cents,
                                       number_of_installments: context.number_of_installments
                                     )
                                   end

        # Criar payment plan
        # Para recorrência, usar installment_amount e número máximo de meses (12)
        amount_type = is_recurring ? :installment_amount : (context.amount_type || 'total_amount').to_sym
        number_of_installments = is_recurring ? 12 : context.number_of_installments
        
        payment_plan = account.payment_plans.create!(
          type: context.payment_plan_type.to_sym,
          amount_cents: is_recurring ? context.amount_cents * number_of_installments : total_amount_cents,
          amount_type: amount_type,
          number_of_installments: number_of_installments,
          frequency: context.frequency.to_sym
        )

        # Criar primeira transação
        first_transaction = account.transactions.create!(
          transaction_params.merge(
            payment_plan_id: payment_plan.id,
            payment_type_cd: PaymentPlan::TYPES[context.payment_plan_type.to_sym],
            installment_number: 1,
            installment_total: context.number_of_installments,
            installment_type_cd: Transaction::FREQUENCIES[context.frequency.to_sym],
            amount_cents: installment_amount_cents
          )
        )

        # Criar parcelas/recorrências restantes
        (2..context.number_of_installments).each do |installment_number|
          due_date = CalculationsHelper.calculate_due_date(
            due_date: first_transaction.due_date,
            frequency: context.frequency.to_sym,
            number: installment_number - 1
          )

          # Para recorrência, sempre usar o mesmo valor
          # Para parcelamento, ajustar a última parcela para garantir soma exata
          amount_cents = if is_recurring
                          installment_amount_cents
                        elsif installment_number == context.number_of_installments
                          # Última parcela: diferença para garantir soma exata
                          total_amount_cents - (installment_amount_cents * (context.number_of_installments - 1))
                        else
                          installment_amount_cents
                        end

          account.transactions.create!(
            transaction_params.merge(
              payment_plan_id: payment_plan.id,
              payment_type_cd: PaymentPlan::TYPES[context.payment_plan_type.to_sym],
              installment_number: installment_number,
              installment_total: context.number_of_installments,
              installment_type_cd: Transaction::FREQUENCIES[context.frequency.to_sym],
              due_date: due_date,
              amount_cents: amount_cents,
              paid: false,
              paid_at: nil,
              document_number: nil,
              competency_date: nil
            )
          )
        end

        context.transaction = first_transaction
        context.payment_plan = payment_plan
        context.message = I18n.t('transactions.create.success')
      end
    rescue => e
      Rails.logger.error "Erro ao criar transação com parcelamento: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      context.fail!(message: e.message)
    end

    private

    def transaction_params
      {
        name: context.name,
        description: context.description,
        amount_currency: context.amount_currency || 'BRL',
        transaction_type_cd: context.transaction_type_cd,
        due_date: context.due_date,
        paid_at: context.paid_at,
        category_id: context.category_id,
        cost_center_id: context.cost_center_id,
        contact_id: context.contact_id,
        bank_account_id: context.bank_account_id,
        payment_method_cd: context.payment_method_cd || 0,
        paid: context.paid || false,
        competency_date: context.competency_date,
        document_number: context.document_number
      }.compact
    end
  end
end

