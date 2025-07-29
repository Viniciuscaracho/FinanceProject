class AddServiceToTransactions < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_reference :transactions, :service,
                  null: true,
                  foreign_key: { to_table: :offers },
                  index: { algorithm: :concurrently }
  end
end
