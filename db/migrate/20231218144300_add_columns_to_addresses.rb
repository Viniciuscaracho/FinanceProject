class AddColumnsToAddresses < ActiveRecord::Migration[7.0]
  def change
    add_column :addresses, :address_number, :string
    add_column :addresses, :ibge_city_code, :string
  end
end
