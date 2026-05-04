class AddNotificationTrackingToAppointments < ActiveRecord::Migration[7.0]
  def change
    add_column :appointments, :whatsapp_1h_reminder_sent,    :boolean,  default: false, null: false
    add_column :appointments, :whatsapp_1h_reminder_sent_at, :datetime
    add_column :appointments, :billing_notification_sent,    :boolean,  default: false, null: false
    add_column :appointments, :billing_notification_sent_at, :datetime
    add_column :appointments, :pix_reminder_sent,            :boolean,  default: false, null: false
    add_column :appointments, :pix_reminder_sent_at,         :datetime
    add_column :appointments, :overdue_notification_sent,    :boolean,  default: false, null: false
    add_column :appointments, :overdue_notification_sent_at, :datetime

    add_index :appointments, :billing_notification_sent
    add_index :appointments, :overdue_notification_sent
  end
end
