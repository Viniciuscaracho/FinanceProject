class AddIndexTsvBodyToTransactions < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def up
    add_index :transactions, :tsv_body, using: :gin
    add_index :domains, :tsv_body, using: :gin
    add_index :people, :tsv_body, using: :gin

    #Transaction.reindex_all
    #Contact.reindex_all
    #Domain.reindex_all
  end
end
