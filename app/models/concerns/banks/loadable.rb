# frozen_string_literal: true

module Banks
  module Loadable
    extend ActiveSupport::Concern

    included do
      include HTTParty

      base_uri 'https://brasilapi.com.br/api'
    end

    class_methods do
      def load_banks!(country: 'BR')
        response = get('/banks/v1', format: :plain)
        return if response.code != 200

        data = JSON.parse(response, symbolize_names: true)
        data.each do |item|
          next if item[:code].blank?

          Bank.create_with(
            country:,
            code: item[:code],
            name: item[:name],
            description: item[:fullName],
            ispb: item[:ispb]
          ).find_or_create_by!(
            country:,
            code: item[:code]
          )
        end

        data
      end
    end
  end
end
