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
require "test_helper"

class AnnouncementTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
