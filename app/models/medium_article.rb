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
class MediumArticle < HelpUser
  validates :link, presence: true
  validates :description, presence: true
end
