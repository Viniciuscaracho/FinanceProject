class CreateCoachingCreditTransactions < ActiveRecord::Migration[7.0]
  def change
    create_table :coaching_credit_transactions do |t|
      t.references :coaching_credit_wallet, null: false, foreign_key: true,
                   index: { name: 'idx_coaching_credit_tx_wallet' }
      t.references :account, null: false, foreign_key: true,
                   index: { name: 'idx_coaching_credit_tx_account' }
      t.integer :amount,        null: false             # + crédito / - débito
      t.integer :balance_after, null: false             # saldo resultante (auditoria)
      t.string  :kind,          null: false             # monthly_grant | debit | recharge | adjustment | refund
      t.string  :description
      t.references :source, polymorphic: true, null: true,
                   index: { name: 'idx_coaching_credit_tx_source' } # TimelineEvent (débito) / cobrança (recarga)
      t.jsonb   :metadata,      null: false, default: {}

      t.timestamps
    end

    add_index :coaching_credit_transactions, %i[account_id created_at],
              name: 'idx_coaching_credit_tx_account_created'
    add_index :coaching_credit_transactions, %i[kind created_at],
              name: 'idx_coaching_credit_tx_kind_created'
  end
end
