class AddVisibleAmountToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :visible_amount, :boolean, null: false, default: true, comment: 'Whether the user can see the amount of the referral code'
  end
end
