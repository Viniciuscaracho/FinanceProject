class CreateCoachingCreditWallets < ActiveRecord::Migration[7.0]
  def change
    create_table :coaching_credit_wallets do |t|
      t.references :account, null: false, foreign_key: true, index: { unique: true }
      t.integer  :balance,           null: false, default: 0    # saldo atual de créditos (áudios)
      t.integer  :monthly_allowance, null: false, default: 200  # franquia que renova por ciclo
      t.datetime :renews_at                                     # próxima renovação da franquia

      t.timestamps
    end
  end
end
