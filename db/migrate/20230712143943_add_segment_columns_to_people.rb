class AddSegmentColumnsToPeople < ActiveRecord::Migration[7.0]
  def change
    add_reference :people, :sector_activity, null: true, foreign_key: { to_table: :segments }
  end
end
