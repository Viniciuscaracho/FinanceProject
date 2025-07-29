class AddStripeAttributesToAccounts < ActiveRecord::Migration[7.0]
  def change
    add_column :accounts, :processor_customer_id, :string
    add_column :accounts, :processor_plan_id, :string
    add_column :accounts, :processor_plan_name, :string
    add_column :accounts, :subscription_status, :string, default: :incomplete
    add_column :accounts, :trial_ends_at, :date
  end
end
