class CreateReferralCodes < ActiveRecord::Migration[7.0]
  def change
    create_table :referral_codes do |t|
      t.references :account, null: false, foreign_key: true, comment: 'Referrer that owns this referral code'
      t.string :code, null: false, comment: 'Unique referral code'
      t.string :name, null: false, comment: 'Name of the referral code'
      t.text :description, comment: 'Description of the referral code'
      t.integer :benefit_type_cd, null: false, default: 0, comment: 'Benefit type'
      t.integer :benefit, null: false, default: 0, comment: 'Benefit (in percentage)'

      t.timestamps
      t.datetime :discarded_at
    end

    add_index :referral_codes, %i[code], unique: true
    add_index :referral_codes, %i[account_id discarded_at]
  end
end
