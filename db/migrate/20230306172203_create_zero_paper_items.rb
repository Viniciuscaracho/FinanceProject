class CreateZeroPaperItems < ActiveRecord::Migration[7.0]
  def change
    create_table :zero_paper_items do |t|
      t.references :import, null: false, foreign_key: true
      t.string :transaction_type
      t.date :due_date
      t.date :competency_date
      t.string :name
      t.float :amount
      t.string :category
      t.string :contact
      t.boolean :paid
      t.text :description
      t.string :bank_account
      t.string :document_number
      t.string :payment_method
      t.string :cost_center
      t.string :tags

      t.timestamps
    end
  end
end
