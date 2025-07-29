# frozen_string_literal: true

# == Schema Information
#
# Table name: announcements
#
#  id                                              :bigint           not null, primary key
#  abstract(Abstract of announcement)              :string
#  kind(Kind of announcement)                      :string           default("new"), not null
#  notification_sent_at(Date of notification sent) :datetime
#  published_at(Date of publication)               :datetime         not null
#  send_notification(Send notification to users)   :boolean          default(FALSE), not null
#  show_banner(Show banner on dashboard)           :boolean          default(FALSE), not null
#  title(Title of announcement)                    :string           not null
#  created_at                                      :datetime         not null
#  updated_at                                      :datetime         not null
#
# Indexes
#
#  index_announcements_on_id                            (id)
#  index_announcements_on_show_banner_and_published_at  (show_banner,published_at)
#
class Announcement < ApplicationRecord
  KINDS = %i[new fix improvement update warning alert].freeze

  as_enum :kind, KINDS, map: :string, source: :kind

  has_rich_text :description
  has_noticed_notifications

  # Validations
  validates :kind, :title, :description, :published_at, presence: true
  validates :kind, inclusion: { in: KINDS }

  # Scopes
  scope :unread,                ->(last_announcement_read) { where('published_at > ?', last_announcement_read) }
  scope :marked_to_show_banner, -> { where(show_banner: true) }
  scope :send_notification,     -> { where(send_notification: true) }

  # Callbacks
  after_initialize :set_defaults

  after_create_commit  :broadcast_after_create
  after_update_commit  :broadcast_after_update
  after_destroy_commit :broadcast_after_destroy

  def set_defaults
    self.published_at ||= Time.current
  end

  private

  def broadcast_after_update
    if show_banner?
      if show_banner_previously_changed?
        broadcast_append_later_to 'announcements'
      else
        broadcast_replace_later_to 'announcements'
      end
    else
      broadcast_remove_to 'announcements'
    end
  end

  def broadcast_after_create
    broadcast_append_later_to 'announcements' if show_banner?
    DispatchAnnouncementNotificationJob.perform_later(self) if send_notification?
  end

  def broadcast_after_destroy
    broadcast_remove_to 'announcements' if show_banner?
    notifications_as_announcement.destroy_all
  end

end
