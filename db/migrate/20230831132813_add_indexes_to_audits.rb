class AddIndexesToAudits < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_index :audits, %i[associated_id associated_type auditable_type user_type], name: 'index_audits_on_home_page', algorithm: :concurrently, if_not_exists: true
    add_index :audits, %i[associated_type associated_id auditable_type user_type created_at], order: { created_at: :desc }, name: 'index_audits_on_home_page_with_created_at', algorithm: :concurrently, if_not_exists: true
  end
end
