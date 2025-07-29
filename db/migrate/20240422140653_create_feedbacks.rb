class CreateFeedbacks < ActiveRecord::Migration[7.0]
  def change
    create_table :feedbacks do |t|
      t.references :user, null: false, foreign_key: true
      t.integer :rating
      t.text :observations

      t.timestamps
    end
  end
end
