class AddMessageToImports < ActiveRecord::Migration[7.0]
  def change
    add_column :imports, :message, :string
  end
end
