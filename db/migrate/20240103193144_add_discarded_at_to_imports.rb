class AddDiscardedAtToImports < ActiveRecord::Migration[7.0]
  def change
    add_column :imports, :discarded_at, :datetime
  end
end
