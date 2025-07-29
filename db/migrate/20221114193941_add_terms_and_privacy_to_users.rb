class AddTermsAndPrivacyToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :accepted_terms_at, :datetime
    add_column :users, :accepted_privacy_at, :datetime
  end
end
