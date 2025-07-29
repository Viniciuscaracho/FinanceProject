# == Schema Information
#
# Table name: help_users
#
#  id               :bigint           not null, primary key
#  description      :text
#  link             :text             not null
#  title            :text
#  type             :string           not null
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  youtube_video_id :string
#
require "test_helper"

class HelpUserTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
