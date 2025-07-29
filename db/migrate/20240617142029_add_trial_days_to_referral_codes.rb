class AddTrialDaysToReferralCodes < ActiveRecord::Migration[7.0]
  def change
    add_column :referral_codes, :trial_days, :integer, default: 30, null: false
    add_column :referral_codes, :create_free_personal_account, :boolean, default: true, null: false
    add_column :referral_codes, :account_type_cd, :integer, default: 0, null: false
  end
end
