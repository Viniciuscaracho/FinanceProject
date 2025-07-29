# frozen_string_literal: true

module Balanceable
  extend ActiveSupport::Concern

  included do
    has_many :balances, as: :balanceable, dependent: :destroy
  end
end
