class AddIndexToZeroPaperItems < ActiveRecord::Migration[7.0]
  def change
    add_index :zero_paper_items, %i[transaction_type due_date name amount paid],
              name: :index_zero_paper_items_on_filters
  end
end
