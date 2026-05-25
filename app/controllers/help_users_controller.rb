# frozen_string_literal: true

class HelpUsersController < ApplicationController
  before_action :set_help_user, only: %i[show]
  # GET /help_users
  def index
    YoutubeVideo.all
  end

  def show
    @youtube_videos = YoutubeVideo.all
    @youtube_video = @youtube_videos.find(params[:id])
  end

  def videos_modal
    @youtube_videos = YoutubeVideo.all
    @youtube_video = if params[:youtube_video].present?
                       @youtube_videos.find(params[:youtube_video])
                     else
                       @youtube_videos.first
                     end
  end

  def initial_modal
    @youtube_videos = YoutubeVideo.all
    @youtube_video = @youtube_videos.first
    @medium_articles = MediumArticle.order(created_at: :desc)
    @medium_article = @medium_articles.first
  end
  def save_checkbox_state
    if params[:user] && params[:user][:onboarding_created_at]
      onboarding_checkbox_value = params[:user][:onboarding_created_at]

      if onboarding_checkbox_value == "1"
        Current.user.update!(onboarding_created_at: Date.current)
      end
    end
   end

  def search_modal
    @medium_articles = MediumArticle.order(created_at: :desc)
    @medium_article = @medium_articles.first
  end

  private

  def set_help_user
    @youtube_video = YoutubeVideo.find(params[:id])
  end
end

