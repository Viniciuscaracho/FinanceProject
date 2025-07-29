# frozen_string_literal: true

module Statements
  class Place
    include Interactor::Organizer

    organize Statements::Create, StatementItems::BulkCreate
  end
end
