# frozen_string_literal: true

class CreateDataMigrationToNewInstallments < ActiveRecord::Migration[7.0]
  def up
    # Pega todas as transactions que são parcelas e recorrentes e que são a própria origem da parcela
    Transaction.where('payment_type_cd IN (1, 2) AND installment_source_id IS NOT NULL AND installment_source_id = id').find_each do |t|
      # cria um novo payment_plan para a transação atual
      payment_plan = t.account.payment_plans.create!(
        type: t.payment_type,
        amount_cents: t.installment? ? t.installments.sum(:exchanged_amount_cents) : t.amount_cents,
        frequency: t.installment_type,
        number_of_installments: t.installments.count
      )
      # atualiza todas as parcelas da transação atual para que elas tenham o payment_plan criado e não tenham mais o installment_source_id
      # que futuramente será suprimido
      t.installments.update_all(payment_plan_id: payment_plan.id)
    end
  end

  def down; end
end
