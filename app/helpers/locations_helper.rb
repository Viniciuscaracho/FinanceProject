# frozen_string_literal: true

module LocationsHelper
  def cities(country:, state:)
    return [] if country.blank? || state.blank?

    if country == 'BR'
      state_enum = State.where(key: state)
      City.where(parent: state_enum).order(:value).collect { |item| [item.name, item.name] }
    else
      (CS.cities(state.to_sym, country.to_sym) || []).collect { |item| [item, item] }
    end
  end

  def city_options_for_select(country:, state:, selected_city: nil)
    options_for_select(cities(country:, state:), selected_city)
  end

  def states(country:)
    return [] if country.blank?
    return State.order(:value).collect { |item| [item.name, item.key] } if country == 'BR'

    (CS.states(country.to_sym) || {}).invert
  end

  def state_options_for_select(country:, selected_state: nil)
    options_for_select(states(country:), selected_state)
  end

  def countries
    CS.countries.invert
  end

  def country_options_for_select(selected_country: nil)
    options_for_select(countries, selected_country)
  end
end
