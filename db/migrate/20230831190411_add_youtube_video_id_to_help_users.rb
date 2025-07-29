class AddYoutubeVideoIdToHelpUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :help_users, :youtube_video_id, :string
  end
end
