class CreateAnnouncements < ActiveRecord::Migration[7.0]
  def change
    create_table :announcements do |t|
      t.string :kind,                   null: false, default: 'new', comment: 'Kind of announcement'
      t.string :title,                  null: false, comment: 'Title of announcement'
      t.string :abstract,               comment: 'Abstract of announcement'
      t.datetime :published_at,         null: false, comment: 'Date of publication'
      t.boolean :show_banner,           null: false, default: false, comment: 'Show banner on dashboard'
      t.boolean :send_notification,     null: false, default: false, comment: 'Send notification to users'
      t.datetime :notification_sent_at, comment: 'Date of notification sent'

      t.timestamps
    end

    add_index :announcements, %i[show_banner published_at]
    add_index :announcements, :id, order: { id: :desc }
  end
end
