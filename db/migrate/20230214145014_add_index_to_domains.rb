class AddIndexToDomains < ActiveRecord::Migration[7.0]
  def change
    add_index :domains, %i[id type]
  end
end
