# frozen_string_literal: true

class SettingsController < ApplicationController
  before_action :set_target

  # GET /categories/1/edit
  def edit; end

  # PATCH/PUT /categories/1 or /categories/1.json
  def update
    result = Settings::Update.call(
      target: @target,
      params: settings_params
    )

    respond_to do |format|
      if result.success?
        format.html { redirect_to categories_url }
        format.json { render :show, status: :ok, location: @target }
        format.turbo_stream
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: result.message, status: :unprocessable_entity }
      end
    end
  end
end
