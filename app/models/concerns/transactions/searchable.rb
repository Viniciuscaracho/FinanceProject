# frozen_string_literal: true

# This module is responsible for the search of the Transaction model
module Transactions
  module Searchable
    extend ActiveSupport::Concern

    included do
      include PgSearch::Model

      after_commit :reindex, on: %i[create update]

      pg_search_scope(
        :search_by_q,
        against: columns_to_reindex,
        using: { tsearch: { prefix: true, tsvector_column: :tsv_body } },
        ignoring: :accents
      )

      pg_search_scope(
        :search_by_similarity,
        against: columns_to_reindex,
        using: { tsearch: { prefix: true, tsvector_column: :tsv_body }, trigram: { threshold: 0.3 } },
        ignoring: :accents
      )
    end

    def reindex
      Transaction.reindex_by_account_id(account_id, :id, id)
    end

    # Class methods
    class_methods do
      def columns_to_reindex
        %i[name description amount_cents exchanged_amount_cents document_number]
      end

      def reindex_range(start_id, end_id)
        return false if start_id.blank? && end_id.blank?

        sql = <<~SQL.squish
          #{update_tsv_body_sql_base} AND transactions.id BETWEEN :start_id AND :end_id
        SQL

        connection.update(sanitize_sql([sql, { start_id:, end_id: }]), 'Transaction reindex_range')
      end

      def reindex_by(key, value)
        return false if key.blank? || value.blank?

        sql = <<~SQL.squish
          #{update_tsv_body_sql_base} AND transactions.#{key} = :#{key}
        SQL

        connection.update(sanitize_sql([sql, { key => value }]), 'Transaction reindex_by')
      end

      def reindex_by_account_id(account_id, key, value)
        return false if key.blank? || value.blank?

        sql = <<~SQL.squish
          #{update_tsv_body_sql_base} AND transactions.account_id = :account_id AND transactions.#{key} = :#{key}
        SQL

        connection.execute(sanitize_sql([sql, { account_id:, key => value }]), 'Transaction reindex_by_account_id')
      end

      def reindex_all
        connection.update(sanitize_sql(update_tsv_body_sql_base.squish), 'Transaction reindex_all')
      end

      def update_tsv_body_sql_base
        date_format = I18n.t('shared.date_format').upcase

        <<~SQL
          UPDATE transactions
             SET tsv_body = to_tsvector('simple', unaccent(CONCAT_WS(' ', to_char(transactions.due_date, '#{date_format}'),
                             transactions.name, transactions.description,
                             transactions.amount_cents,
                             transactions.exchanged_amount_cents, contacts.first_name, contacts.last_name,
                             categories.name, cost_centers.name, bank_accounts.name, transfer_to.name, transactions.document_number,
                             services.name,
                             (SELECT string_agg(tags.name, ' ')
                                FROM taggings
                          INNER JOIN tags ON taggings.tag_id = tags.id
                               WHERE taggings.taggable_id = transactions.id
                                 AND taggings.taggable_type = 'Transaction'
                            GROUP BY taggings.taggable_type, taggings.taggable_id))))
            FROM transactions tx
            LEFT OUTER JOIN bank_accounts             ON tx.bank_account_id = bank_accounts.id
            LEFT OUTER JOIN bank_accounts transfer_to ON tx.transfer_to_id  = transfer_to.id
            LEFT OUTER JOIN people contacts           ON tx.contact_id      = contacts.id AND contacts.type = 'Contact'
            LEFT OUTER JOIN domains categories        ON tx.category_id     = categories.id AND categories.type = 'Category'
            LEFT OUTER JOIN domains cost_centers      ON tx.cost_center_id  = cost_centers.id AND cost_centers.type = 'CostCenter'
            LEFT OUTER JOIN offers services           ON tx.service_id      = services.id AND services.type = 'Service'
           WHERE transactions.id = tx.id
        SQL
      end
    end
  end
end
