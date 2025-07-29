class DispatchAnnouncementNotificationJob < ApplicationJob
  queue_as :default

  def perform(announcement)
    AnnouncementNotification.with(announcement:).deliver_later(AccountUser.confirmeds)
  end
end
