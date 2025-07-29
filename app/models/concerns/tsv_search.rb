# frozen_string_literal: true

module TsvSearch
  extend ActiveSupport::Concern

  included do
    after_commit :reindex_tsv_body, on: %i[create update]

    pg_search_scope(
      :search_by_tsv_body,
      against: columns_to_reindex,
      using: { tsearch: { prefix: true, tsvector_column: tsv_column } },
      ignoring: :accents
    )
  end

  def reindex_tsv_body
    Invoice.reindex_by(:id, id)
  end

  class_methods do
    def tsv_column
      :tsv_body
    end

    def columns_to_reindex
      %i[id created_at updated_at]
    end

    def join_columns_to_reindex
      []
    end

    def tsv_body_sql
      [
        columns_to_reindex.map { |column| "COALESCE(#{table_name}.#{column}::text, '')" },
        join_columns_to_reindex.map { |column| "COALESCE(#{column}::text, '')" }
      ].flatten.join(', ')
    end

    def reindex_by(column, value)
      return false if column.blank? || value.blank?

      sql = <<~SQL.squish
        #{update_tsv_body_sql_base} AND #{table_name}.#{column} = :#{column}
      SQL

      connection.update(sanitize_sql([sql, { column => value }]), "#{name} reindex_by")
    end

    def update_tsv_body_sql_base
      <<~SQL.squish
        UPDATE #{table_name} as #{table_name.first}
        SET tsv_body = to_tsvector("simple", unaccent(CONCAT_WS(' ', #{tsv_body_sql}))::text)
        FROM #{table_name}
        WHERE #{table_name.first}.id = #{table_name}.id
      SQL
    end
  end
end
