# frozen_string_literal: true

Rails.configuration.to_prepare do
  PgSearch.multisearch_options = {
    using: {
      tsearch: {
        prefix: true,
        tsvector_column: :tsv_body
      },
      trigram: {}
    },
    ignoring: :accents
  }

  PgSearch::Document.include PgSearch::Documents::Searchable
end
