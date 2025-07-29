class CreateWebhooks < ActiveRecord::Migration[7.0]
  def change
    create_table :webhooks do |t|
      t.string :url
      t.datetime :last_used_at
      t.integer :last_response
      t.references :account, null: false, foreign_key: true

      t.timestamps
    end
  end
end
