class AddCurrentPeriodStartAndEndToAccounts < ActiveRecord::Migration[7.0]
  def change
    add_column :accounts, :current_period_starts_at, :datetime
    add_column :accounts, :current_period_ends_at, :datetime
  end
end
