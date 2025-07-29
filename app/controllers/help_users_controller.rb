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

  # GET /help_users/1/edit
  # def edit
  # end

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

  # POST /help_users or /help_users.json
  # def create
  #   @help_user = HelpUser
  #
  #   respond_to do |format|
  #     if @help_user.save
  #       notice = t('.success')
  #       format.html { redirect_to help_users_url, notice: notice }
  #       format.json { render :show, status: :created, location: @help_user }
  #       format.turbo_stream { flash.now.notice = notice }
  #     else
  #       format.html { render :new, status: :unprocessable_entity }
  #       format.json { render json: @help_user.errors, status: :unprocessable_entity }
  #     end
  #   end
  # end

  # PATCH/PUT /help_users/1 or /help_users/1.json
  # def update
  #   respond_to do |format|
  #     if @help_user.update(help_user_params)
  #       notice = t('.success')
  #       format.html { redirect_to help_users_url, notice: notice }
  #       format.json { render :show, status: :ok, location: @help_user }
  #       format.turbo_stream { flash.now.notice = notice }
  #     else
  #       format.html { render :edit, status: :unprocessable_entity }
  #       format.json { render json: @help_user.errors, status: :unprocessable_entity }
  #     end
  #   end
  # end

  # DELETE /help_users/1 or /help_users/1.json
  # def destroy
  #   @help_user.destroy
  #   respond_to { |format|
  #     notice = t('.success')
  #     format.html { redirect_to help_users_url, notice: notice }
  #     format.json { head :no_content }
  #     format.turbo_stream { flash.now.notice = notice }
  #   }
  # end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_help_user
    @youtube_video = YoutubeVideo.find(params[:id])
  end

  # Only allow a list of trusted parameters through.
  def help_user_params
    params.require(:help_user).permit(:link, :title, :description)
  end
end

