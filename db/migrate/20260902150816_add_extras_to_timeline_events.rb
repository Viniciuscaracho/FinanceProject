class AddExtrasToTimelineEvents < ActiveRecord::Migration[7.0]
  def change
    add_column :timeline_events, :extras, :jsonb
  end
end
