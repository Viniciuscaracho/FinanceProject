class RecreateReferralCodeTable < ActiveRecord::Migration[7.0]
  def up
    # Remove all referral codes
    ReferralCode.destroy_all

    remove_index :referral_codes, %i[account_id discarded_at]
    remove_reference :referral_codes, :account, null: false, foreign_key: true, comment: 'Referrer that owns this referral code'
    remove_reference :accounts, :referred_by, null: true, foreign_key: { to_table: :accounts }, comment: 'Referrer account'

    add_reference :accounts, :related_to, null: true, foreign_key: { to_table: :accounts }, comment: 'Related to account'
    add_column :accounts, :relation_type_cd, :integer, null: true, comment: 'Relation type'
    add_reference :referral_codes, :referrer, polymorphic: true, comment: 'Referrer that owns this referral code'
    add_index :referral_codes, %i[discarded_at]
  end

  def down
    remove_reference :accounts, :related_to, null: true, foreign_key: { to_table: :accounts }, comment: 'Related to account'
    remove_column :accounts, :relation_type_cd, :integer, null: true, comment: 'Relation type'
    remove_index :referral_codes, %i[discarded_at]
    remove_reference :referral_codes, :referrer, polymorphic: true, null: false, comment: 'Referrer that owns this referral code'

    add_reference :accounts, :referred_by, null: true, foreign_key: { to_table: :accounts }, comment: 'Referrer account'
    add_reference :referral_codes, :account, foreign_key: true, comment: 'Referrer that owns this referral code'
    add_index :referral_codes, %i[account_id discarded_at]
  end
end
