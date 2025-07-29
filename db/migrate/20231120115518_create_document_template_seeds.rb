class CreateDocumentTemplateSeeds < ActiveRecord::Migration[7.0]
  def change
    create_table :document_template_seeds do |t|
      t.string :type
      t.string :title
      t.string :description
      t.text :content

      t.timestamps
    end
  end
end
