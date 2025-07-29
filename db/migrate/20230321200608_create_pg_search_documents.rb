# frozen_string_literal: true

class CreatePgSearchDocuments < ActiveRecord::Migration[7.0]
  def up
    say_with_time('Creating table for pg_search multisearch') do
      create_table :pg_search_documents do |t|
        t.references :account, null: false, foreign_key: true
        t.belongs_to :searchable, polymorphic: true, index: true
        t.text :content
        t.date :date, index: true
        t.tsvector :tsv_body, index: { using: :gin }

        t.timestamps null: false
      end
    end
  end

  def down
    say_with_time('Dropping table for pg_search multisearch') do
      drop_table :pg_search_documents
    end
  end
end
