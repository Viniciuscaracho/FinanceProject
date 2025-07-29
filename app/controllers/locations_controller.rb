# frozen_string_literal: true

class LocationsController < ApplicationController
  def index
    @target = params[:target]

    case @target.to_sym
    when /state/
      states
    when /city/
      cities
    else
      countries
    end
  end

  private

  def countries
    @items = [[t('addresses.form.select_country'), nil]]
    @items += CS.countries.invert
  end

  def states
    @items = [[t('addresses.form.select_state'), nil]]
    return if params[:country].blank?

    @items += if params[:country].to_sym == :BR
                State.order(:value).map { |item| [item.value, item.key] }
              else
                CS.states(params[:country].to_sym).map { |item| [item.last, item.first] }
              end
  end

  def cities
    @items = [[t('addresses.form.select_city'), nil]]
    return if params[:state].blank?

    if params[:country].to_sym == :BR
      state = State.find_by(key: params[:state])
      @items += state.cities.order(:value).map { |item| [item.value, item.value] }
    else
      @items += (CS.cities(params[:state].to_sym, params[:country].to_sym) || []).map { |item| [item, item] }
    end
  end
end
