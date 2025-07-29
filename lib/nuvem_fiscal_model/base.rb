# frozen_string_literal: true

module NuvemFiscalModel
  # Represents the base object from Nuvem Fiscal
  class Base
    include ActiveModel::API

    def initialize(attributes = {})
      super
      valid?
    end

    def valid?(context = nil)
      valid = super
      raise_validation_error unless valid
      valid
    end

    def as_json(options = nil)
      to_h
    end

    def to_h
      # exclude validation_context and errors from the hash
      instance_values.except('validation_context', 'errors')
    end
  end
end
