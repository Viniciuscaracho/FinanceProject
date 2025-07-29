class CreateSecondaryCnaes < ActiveRecord::Migration[7.0]
  def change
    create_table :secondary_cnaes do |t|
      t.references :person, null: false, foreign_key: true
      t.references :cnae, null: false, foreign_key: { to_table: :enums }

      t.timestamps
    end

    add_index :secondary_cnaes, %i[person_id cnae_id], unique: true
  end
end
