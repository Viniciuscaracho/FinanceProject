# frozen_string_literal: true

module Accounts
  module Searchable
    extend ActiveSupport::Concern

    included do
      include PgSearch::Model

      pg_search_scope(
        :search_by_q,
        associated_against: {
          company: %i[first_name last_name email phone_number document_1]
        },
        using: { tsearch: { prefix: true } },
        ignoring: :accents
      )
    end
  end
end
