# frozen_string_literal: true

module Services
  module Searchable
    extend ActiveSupport::Concern

    included do
      include PgSearch::Model

      pg_search_scope(
        :search_by_q,
        against: %i[internal_code name description],
        using: { tsearch: { prefix: true } },
        ignoring: :accents
      )
    end
  end
end
