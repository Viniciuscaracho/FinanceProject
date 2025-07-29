# frozen_string_literal: true
class StaticTotalizerController < ApplicationController
  before_action :set_current_user

  def update
    @current_user.preference_static_totalizer = params[:preference_static_totalizer]
    @current_user.save
  end

  def toggle
    @current_user.preference_static_totalizer = !@current_user.preference_static_totalizer
    @current_user.save
  end

  private

  def set_current_user
    @current_user = current_user
  end
end
