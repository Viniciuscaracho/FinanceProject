class FeedbacksController < ApplicationController
  # GET /feedbacks
  require 'httparty'
  def index; end

  def new
    @feedback = Feedback.new
  end

  # POST /feedbacks or /feedbacks.json
  def create
    @feedback = current_user.feedback.new(feedback_params)

    respond_to do |format|
      if @feedback.save
        notice = t('.success')
        format.turbo_stream { flash.now.notice = notice }
        FeedbackDeliverJob.perform_later(@feedback.id) if Rails.env.production?
      else
        notice = t('.error')
        format.turbo_stream { flash.now.alert = notice }
      end
    end
  end

  private
  def feedback_params
    params.require(:feedback).permit(:user_id, :rating, :observations)
  end
end