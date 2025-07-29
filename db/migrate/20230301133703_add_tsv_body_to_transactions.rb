class AddTsvBodyToTransactions < ActiveRecord::Migration[7.0]
  def up
    enable_extension 'pg_trgm' unless extension_enabled?('pg_trgm')

    add_column :transactions, :tsv_body, :tsvector
    add_column :domains, :tsv_body, :tsvector
    add_column :people, :tsv_body, :tsvector
  end

  def down
    disable_extension('pg_trgm') if extensions.include?('pg_trgm')

    remove_column :transactions, :tsv_body, :tsvector
    remove_column :domains, :tsv_body, :tsvector
    remove_column :people, :tsv_body, :tsvector
  end
end
