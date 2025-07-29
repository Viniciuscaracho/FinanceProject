# frozen_string_literal: true

class CitiesController < ApplicationController
  def index
    @items = City.search_by_q(params[:q]).order(:value)
    @items = @items.where(state_id: params[:state_id]) if params[:state_id].present?
  end

  def autocomplete
    @cities = City.search_by_q(params[:q]).order(:value)
    @cities = @cities.where(state_id: params[:state_id]) if params[:state_id].present?

    render json: @cities.map(&:to_autocomplete), status: :ok
  end
end
