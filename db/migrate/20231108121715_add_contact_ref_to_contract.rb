class AddContactRefToContract < ActiveRecord::Migration[7.0]
  def change
    add_reference :contracts, :contact, foreign_key: { to_table: :people }
  end
end
