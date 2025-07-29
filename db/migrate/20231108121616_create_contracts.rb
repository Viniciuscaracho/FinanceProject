class CreateContracts < ActiveRecord::Migration[7.0]
  def change
    create_table :contracts do |t|
      t.text :title
      t.text :description
      t.text :content
      t.references :contract_template, null: false, foreign_key: { to_table: :document_templates }

      t.timestamps
    end
  end
end
