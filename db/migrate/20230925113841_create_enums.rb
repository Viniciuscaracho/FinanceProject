class CreateEnums < ActiveRecord::Migration[7.0]
  def change
    create_table :enums do |t|
      t.references :parent, null: true, foreign_key: { to_table: :enums }
      t.string :type, null: false
      # t.string :locale, null: false, default: 'pt-BR'
      t.string :code, null: false
      t.string :name, null: false
      t.text :description
      t.jsonb :data, null: false, default: {}

      t.timestamps
      t.datetime :discarded_at
    end

    add_index :enums, %i[type code], unique: true
    add_index :enums, %i[type discarded_at]
  end
end
