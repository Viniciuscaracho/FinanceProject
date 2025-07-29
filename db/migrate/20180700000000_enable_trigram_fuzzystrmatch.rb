class EnableTrigramFuzzystrmatch < ActiveRecord::Migration[6.1]
  def change
    enable_extension "pg_trgm" unless extension_enabled?('pg_trgm')
    enable_extension "unaccent" unless extension_enabled?('unaccent')
    enable_extension "fuzzystrmatch" unless extension_enabled?('fuzzystrmatch')
  end
end
