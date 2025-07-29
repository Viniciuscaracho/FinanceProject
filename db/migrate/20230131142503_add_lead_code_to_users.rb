class AddLeadCodeToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :lead_code, :bigint
    add_column :users, :zp_user, :boolean
    add_column :users, :contact_me_by, :string
    add_column :users, :phone_number, :string
    add_column :users, :postcode, :string
  end
end
