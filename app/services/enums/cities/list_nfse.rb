# frozen_string_literal: true

module Enums
  module Cities
    class ListNfse < ApplicationService
      def call
        context.cities = City.able_to_emit_nfses
      end
    end
  end
end
