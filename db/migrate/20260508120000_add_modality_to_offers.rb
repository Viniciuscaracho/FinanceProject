class AddModalityToOffers < ActiveRecord::Migration[7.0]
  def change
    add_column :offers, :modality, :integer, default: 0, null: false
    add_column :offers, :meeting_url, :string
  end
end
