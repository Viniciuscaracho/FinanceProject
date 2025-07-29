# frozen_string_literal: true

module Addresses
  module Addressable
    extend ActiveSupport::Concern

    included do
      has_many :addresses, as: :addressable, dependent: :delete_all
      accepts_nested_attributes_for :addresses, reject_if: :blank?

      has_one :address, as: :addressable, dependent: :delete
      accepts_nested_attributes_for :address, reject_if: :blank?
    end
  end
end
