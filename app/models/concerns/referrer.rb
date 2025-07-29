# frozen_string_literal: true

module Referrer
  extend ActiveSupport::Concern

  included do
    has_many :referral_codes, dependent: :delete_all, as: :referrer
    has_many :referees, through: :referral_codes, source: :referees
  end
end
