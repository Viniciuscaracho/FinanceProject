class CreateDocumentTemplates < ActiveRecord::Migration[7.0]
  def change
    create_table :document_templates do |t|
      t.string :name, null: false
      t.text :description
      t.string :type
      t.integer :transaction_type_cd
      t.text :content
      t.references :account, null: false, foreign_key: true

      t.timestamps
    end
  end
end
