# frozen_string_literal: true

module AccountUsers
  module Searchable
    extend ActiveSupport::Concern

    included do
      include PgSearch::Model

      pg_search_scope(
        :search_by_q,
        associated_against: {
          user: %i[first_name last_name email]
        },
        using: { tsearch: { prefix: true } },
        ignoring: :accents
      )
    end
  end
end
