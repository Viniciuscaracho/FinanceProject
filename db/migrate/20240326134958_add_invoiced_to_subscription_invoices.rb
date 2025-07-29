class AddInvoicedToSubscriptionInvoices < ActiveRecord::Migration[7.0]
  def change
    add_column :subscription_invoices, :invoiced_at, :datetime
  end
end
