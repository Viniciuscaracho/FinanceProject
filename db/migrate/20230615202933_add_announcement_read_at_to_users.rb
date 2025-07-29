class AddAnnouncementReadAtToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :last_announcement_read_at, :datetime, null: false, default: DateTime.now, comment: 'Date of last read announcement'
  end
end
