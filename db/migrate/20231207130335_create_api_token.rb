class CreateApiToken < ActiveRecord::Migration[7.0]
  def change
    create_table :api_tokens do |t|
      t.references :account, null: false, foreign_key: true
      t.string :token, null: false, index: { unique: true }
      t.datetime :last_used_at
      t.datetime :expires_at
      t.string :name
      t.string :description
      t.references :user, null: false, foreign_key: { to_table: :users }

      t.timestamps
    end
  end
end
