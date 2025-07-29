# frozen_string_literal: true

module Invoices
  module Searchable
    extend ActiveSupport::Concern

    included do
      include PgSearch::Model
      include TsvSearch

      pg_search_scope(
        :search_by_q,
        against: columns_to_reindex,
        using: { tsearch: { prefix: true } },
        ignoring: :accents
      )

      def self.columns_to_reindex
        %i[number name description total_cents]
      end

      def self.join_columns_to_reindex
        [
          "to_char(invoices.issue_date, '#{I18n.t('shared.date_format').upcase}')",
          "to_char(invoices.due_date, '#{I18n.t('shared.date_format').upcase}')",
          'people.first_name',
          'people.last_name',
          'people.document_1',
          'bank_accounts.name'
        ]
      end

      def self.update_tsv_body_sql_base
        <<~SQL.squish
          UPDATE #{table_name} as #{table_name.first}
          SET tsv_body = to_tsvector('simple', unaccent(CONCAT_WS(' ', #{tsv_body_sql}))::text)
          FROM #{table_name}
          LEFT OUTER JOIN people ON people.id = #{table_name}.recipient_id
          LEFT OUTER JOIN bank_accounts ON bank_accounts.id = #{table_name}.bank_account_id
          WHERE #{table_name.first}.id = #{table_name}.id
        SQL
      end
    end
  end
end
