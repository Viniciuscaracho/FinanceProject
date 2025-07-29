class AddNameToAccountInvitations < ActiveRecord::Migration[7.0]
  def change
    add_column :account_invitations, :name, :string
  end
end
