module Exports
  module Constants
    extend ActiveSupport::Concern
    EXPORTS_STATES = {
      in_progress: 0,
      done: 1,
      failed: 2,
      waiting: 3
    }.freeze

    EXPORTS_SOURCES = {
      backup_xlsx: 0,
      contact_xlsx: 1
    }.freeze
  end
end
