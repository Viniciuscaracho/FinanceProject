# == Schema Information
#
# Table name: notifications
#
#  id             :bigint           not null, primary key
#  params         :jsonb
#  read_at        :datetime
#  recipient_type :string           not null
#  type           :string           not null
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#  recipient_id   :bigint           not null
#
# Indexes
#
#  index_notifications_on_read_at    (read_at)
#  index_notifications_on_recipient  (recipient_type,recipient_id)
#
class Notification < ApplicationRecord
  include Noticed::Model
  belongs_to :recipient, polymorphic: true

  delegate :title, :message, :url, :turbo_frame, to: :to_notification

  after_commit :reload_frames_after_commit,  on: %i[create update]
  after_commit :reload_frames_after_destroy, on: :destroy

  private

  def reload_frames_after_commit
    return if recipient.blank?

    broadcast_action_later_to recipient, :notifications_menu, action: :turbo_frame_reload, target: :notifications_menu, html: ''
    replace_notifications_count
  end

  def reload_frames_after_destroy
    return if recipient.blank?

    broadcast_remove_to recipient, :notifications
    replace_notifications_count
  end

  def replace_notifications_count
    return if recipient.blank?

    broadcast_replace_to recipient, :notifications_count,
                         partial: 'notifications/notifications_count',
                         target: :notifications_count,
                         locals: {
                           notifications_count: recipient.notifications.unread.count
                         }
  end
end
