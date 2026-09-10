class CreateEnglishSessions < ActiveRecord::Migration[7.0]
  def change
    create_table :english_sessions do |t|
      t.references :user, null: false, foreign_key: true
      t.string :url
      t.text :raw_content
      t.text :summary
      t.string :status, default: 'pending', null: false

      t.timestamps
    end

    add_index :english_sessions, [:user_id, :created_at]
  end
end
