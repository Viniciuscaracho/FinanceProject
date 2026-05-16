class CreateAnamneseTemplates < ActiveRecord::Migration[7.0]
  def change
    create_table :anamnese_templates do |t|
      t.references :account, null: false, foreign_key: true
      t.string :name, null: false
      t.text :description
      t.jsonb :fields, null: false, default: []
      t.boolean :active, null: false, default: true
      t.timestamps
    end
  end
end
