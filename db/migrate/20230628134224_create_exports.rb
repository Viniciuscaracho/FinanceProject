class CreateExports < ActiveRecord::Migration[7.0]
  def change
    create_table :exports do |t|
      t.references :account, null: false, foreign_key: true
      t.jsonb :params, default: {}, null: false
      t.integer :state_cd, default: 0
      t.integer :source_cd
      t.bigint :progress_number
      t.bigint :progress_total


      t.timestamps
    end
  end
end
