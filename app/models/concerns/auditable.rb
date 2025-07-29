# frozen_string_literal: true

module Auditable
  extend ActiveSupport::Concern

  included do
    audited
  end
end
