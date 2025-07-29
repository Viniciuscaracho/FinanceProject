class CreateStatements < ActiveRecord::Migration[7.0]
  def change
    create_table :statements do |t|
      t.references :account, null: false, foreign_key: true
      t.references :bank_account, null: false, foreign_key: true
      t.integer :type_cd, null: false, index: true
      t.string :workflow_state, null: false, index: true

      t.date :starts_at
      t.date :ends_at

      t.timestamps
      t.datetime :discarded_at, index: true
    end
  end
end
