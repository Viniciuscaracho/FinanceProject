# frozen_string_literal: true

module Banks
  module Searchable
    extend ActiveSupport::Concern

    included do
      include PgSearch::Model

      ActsAsTaggableOn::Tag

      pg_search_scope(:search_by_q, against: %i[name], using: { tsearch: { prefix: true } }, ignoring: :accents)
    end
  end
end
