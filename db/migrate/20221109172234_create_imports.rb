class CreateImports < ActiveRecord::Migration[7.0]
  def change
    create_table :imports do |t|
      t.references :account, null: false, foreign_key: true
      t.integer :source_cd
      t.integer :state_cd
      t.bigint :progress_number
      t.bigint :progress_total

      t.timestamps
    end
  end
end
