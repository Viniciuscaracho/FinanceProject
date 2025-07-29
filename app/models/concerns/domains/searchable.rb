# frozen_string_literal: true

module Domains
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

      case self
      when Category, CostCenter
        self.class.reindex_by_account_id(account_id, :id, id)
      end
    end

    class_methods do
      def columns_to_reindex
        %i[name description]
      end

      def reindex_all
        connection.execute(sanitize_sql([update_tsv_body_sql_base.squish, { type: name }]))
      end

      def reindex_by(key, value)
        return false if key.blank? || value.blank?

        sql = <<~SQL.squish
          #{update_tsv_body_sql_base} AND d.#{key} = :#{key}
        SQL

        connection.execute(sanitize_sql([sql, { type: name, key => value }]))
      end

      def reindex_by_account_id(account_id, key, value)
        return false if account_id.blank? || key.blank? || value.blank?

        sql = <<~SQL.squish
          #{update_tsv_body_sql_base} AND d.account_id = :account_id AND d.#{key} = :#{key}
        SQL

        connection.execute(sanitize_sql([sql, { account_id:, type: name, key => value }]))
      end

      def update_tsv_body_sql_base
        <<~SQL
          UPDATE domains d
             SET tsv_body = to_tsvector('simple', (unaccent(CONCAT_WS(' ', d.name, d.description))))
          WHERE d.type = :type
        SQL
      end
    end
  end
end
