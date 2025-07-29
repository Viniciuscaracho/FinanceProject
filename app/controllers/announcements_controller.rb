# frozen_string_literal: true

class AnnouncementsController < ApplicationController
  before_action :set_announcement, only: %i[show dismiss]

  # GET /announcements
  def index
    @announcements = Announcement.marked_to_show_banner.unread(Current.user.last_announcement_read_at).order(published_at: :desc).limit(1)
  end

  # GET /announcements/1 or /announcements/1.json
  def show
    ActiveRecord::Base.connected_to(role: ActiveRecord.writing_role) do
      dismiss_notification
    end
  end

  # PUT /announcements/1/dismiss or /announcements/1/dismiss.json
  def dismiss
    ActiveRecord::Base.connected_to(role: ActiveRecord.writing_role) do
      Current.user&.update(last_announcement_read_at: Time.current)
      dismiss_notification
    end
  end

  private

  def dismiss_notification
    return unless @announcement.send_notification?

    @announcement.notifications_as_announcement.where(recipient: current_account_user).update(read_at: Time.current)
  end

  # Use callbacks to share common setup or constraints between actions.
  def set_announcement
    @announcement = Announcement.find(params[:id])
  end
end
