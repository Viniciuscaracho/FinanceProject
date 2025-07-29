class ChangeSaleAmountCentsFromOffers < ActiveRecord::Migration[7.0]
  def change
    remove_column :offers, :sale_amount_cents, :string
    add_column :offers, :selling_price_cents, :bigint, null: false, default: 0

    remove_column :offers, :purchase_amount_cents, :string
    add_column :offers, :cost_price_cents, :bigint, null: false, default: 0
  end
end
