# frozen_string_literal: true

module Contacts
  module Searchable
    extend ActiveSupport::Concern

    included do
      include PgSearch::Model

      after_save :reindex

      pg_search_scope(
        :search_by_q,
        against: columns_to_reindex,
        using: {
          tsearch: {
            prefix: true,
            tsvector_column: :tsv_body
          }
        },
        ignoring: :accents
      )
    end

    def reindex
      return if previous_changes.empty?

      self.class.reindex_by(:id, id)
    end

    def call_reindex_transactions_job
      return if previous_changes.empty?

      UpdateTransactionsTsvBodyJob.perform_later(account_id, :contact_id, id)
    end

    class_methods do
      def columns_to_reindex
        %i[first_name last_name email phone_number description]
      end

      def reindex_all
        connection.execute(sanitize_sql(update_tsv_body_sql_base.squish))
      end

      def reindex_by(key, value)
        return false if key.blank? || value.blank?

        sql = <<~SQL.squish
          #{update_tsv_body_sql_base} AND p.#{key} = :#{key}
        SQL

        connection.execute(sanitize_sql([sql, { key => value }]))
      end

      def update_tsv_body_sql_base
        <<~SQL
          UPDATE people p
             SET tsv_body = to_tsvector('simple', (unaccent(CONCAT_WS(' ', p.first_name, p.last_name, p.email, p.phone_number, p.description))))
          WHERE type = 'Contact'
        SQL
      end
    end
  end
end
