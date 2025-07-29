class AddReferralCodeToAccounts < ActiveRecord::Migration[7.0]
  def change
    add_reference :accounts, :referred_by, null: true, foreign_key: { to_table: :accounts }, comment: 'Referrer account'
    add_reference :accounts, :referral_code, null: true, foreign_key: true, comment: 'Referral code used by the referrer'
  end
end
