class CreateSegments < ActiveRecord::Migration[7.0]
  def change
    create_table :segments do |t|
      t.references :parent, null: true, foreign_key: { to_table: :segments }
      t.string :type
      t.integer :transaction_type_cd
      t.string :language, null: false, default: 'pt-BR'
      t.string :name, null: false
      t.text :description

      t.timestamps
      t.datetime :discarded_at
    end

    add_index :segments, :type
    add_index :segments, :transaction_type_cd
    add_index :segments, :language
    add_index :segments, :discarded_at
  end
end
