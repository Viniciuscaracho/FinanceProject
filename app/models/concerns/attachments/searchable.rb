# frozen_string_literal: true

module Attachments
  module Searchable
    extend ActiveSupport::Concern

    included do
      include PgSearch::Model

      after_save :reindex

      pg_search_scope(
        :search_by_q,
        against: columns_to_reindex,
        using: { tsearch: { prefix: true, tsvector_column: :tsv_body }, trigram: {} },
        ignoring: :accents
      )
    end

    def reindex
      sql = <<~SQL.squish
        #{self.class.update_tsv_body_query_base} AND active_storage_attachments.id = :id
      SQL

      self.class.connection.execute(self.class.sanitize_sql([sql, { id: }]))
    end

    class_methods do
      def columns_to_reindex
        %i[tsv_body]
      end

      def update_tsv_body_query_base
        <<~SQL
          UPDATE active_storage_attachments
             SET tsv_body = (to_tsvector('simple', unaccent(coalesce(asb.filename::text, ''))))
            FROM active_storage_attachments asa
            LEFT OUTER JOIN active_storage_blobs asb on asa.blob_id = asb.id
           WHERE active_storage_attachments.id = asa.id
        SQL
      end

      def reindex_all
        connection.execute(sanitize_sql(update_tsv_body_query_base.squish))
      end
    end
  end
end
