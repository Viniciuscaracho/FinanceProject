class AddWhatsappNumberToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :whatsapp_number, :string
  end
end
