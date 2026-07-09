class CreateReviews < ActiveRecord::Migration[7.0]
  def change
    create_table :reviews do |t|
      t.references :account, null: false, foreign_key: true
      t.string  :reviewer_name,  null: false
      t.string  :reviewer_email
      t.integer :rating,         null: false
      t.text    :comment
      t.boolean :approved,       null: false, default: true
      t.string  :source,         default: 'direct' # direct | appointment
      t.bigint  :appointment_id

      t.timestamps
    end

    add_index :reviews, [:account_id, :approved]
    add_index :reviews, :created_at
  end
end
