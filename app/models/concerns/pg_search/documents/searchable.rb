# frozen_string_literal: true

module PgSearch
  module Documents
    module Searchable
      extend ActiveSupport::Concern

      included do
        after_commit :reindex, on: %i[create update]
      end

      protected

      def reindex
        PgSearch::Document.connection.update(
          PgSearch::Document.sanitize_sql(
            [update_tsv_body_sql_base, { id: }]
          ), 'PgSearch::Document reindex'
        )
      end

      def update_tsv_body_sql_base
        <<~SQL
          UPDATE pg_search_documents SET tsv_body = to_tsvector('simple', unaccent(pg_search_documents.content))
           WHERE pg_search_documents.id = :id
        SQL
      end
    end
  end
end
