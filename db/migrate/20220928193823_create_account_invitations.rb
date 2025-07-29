# frozen_string_literal: true

class CreateAccountInvitations < ActiveRecord::Migration[7.0]
  def change
    create_table :account_invitations do |t|
      t.references :account, null: false, foreign_key: true
      t.references :invited_by, null: false, foreign_key: { to_table: :users }
      t.integer :role_cd, null: false, default: 0
      t.string :email, null: false
      t.string :token, null: false

      t.timestamps
    end
  end
end
