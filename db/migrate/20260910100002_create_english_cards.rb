class CreateEnglishCards < ActiveRecord::Migration[7.0]
  def change
    create_table :english_cards do |t|
      t.references :user, null: false, foreign_key: true
      t.references :english_session, null: true, foreign_key: true
      t.string :card_type, null: false
      t.text :front, null: false
      t.text :back, null: false
      t.text :example
      t.string :status, default: 'learning', null: false
      t.datetime :next_review_at
      t.integer :review_count, default: 0, null: false

      t.timestamps
    end

    add_index :english_cards, [:user_id, :card_type]
    add_index :english_cards, [:user_id, :status]
  end
end
