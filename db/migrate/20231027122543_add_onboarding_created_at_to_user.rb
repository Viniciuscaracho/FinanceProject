class AddOnboardingCreatedAtToUser < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :onboarding_created_at, :datetime, default: nil
  end
end
