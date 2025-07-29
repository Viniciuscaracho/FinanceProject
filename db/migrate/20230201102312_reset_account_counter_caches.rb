class ResetAccountCounterCaches < ActiveRecord::Migration[7.0]
  def up
    # Account.find_each do |account|
    #   Account.reset_counters(account.id, :account_users, :account_invitations, :bank_accounts, :contacts, :categories,
    #                          :cost_centers, :transactions)
    # end
  end

  def down; end
end
