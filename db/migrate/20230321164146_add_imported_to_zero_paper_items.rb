class AddImportedToZeroPaperItems < ActiveRecord::Migration[7.0]
  def change
    add_column :zero_paper_items, :imported, :boolean, null: false, default: false

    add_index :zero_paper_items, :imported
  end
end
