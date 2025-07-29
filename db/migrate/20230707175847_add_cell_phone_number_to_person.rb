class AddCellPhoneNumberToPerson < ActiveRecord::Migration[7.0]
  def change
    add_column :people, :cell_phone_number, :string
  end
end
