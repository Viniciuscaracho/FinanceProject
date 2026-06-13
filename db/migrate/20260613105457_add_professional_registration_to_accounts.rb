class AddProfessionalRegistrationToAccounts < ActiveRecord::Migration[7.0]
  def change
    add_column :accounts, :professional_registration, :string
  end
end
