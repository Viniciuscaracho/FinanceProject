class AddAbacatePayCustomerIdToAccounts < ActiveRecord::Migration[7.0]
  def change
    add_column :accounts, :abacate_pay_customer_id, :string
  end
end
