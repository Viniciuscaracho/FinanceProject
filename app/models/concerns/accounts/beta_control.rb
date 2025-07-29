# frozen_string_literal: true

module Accounts
  module BetaControl
    extend ActiveSupport::Concern

    included do
    end

    # Temp methods
    # TODO: remove methods after 01/04/2023

    def launch_promo_period_starts_at
      beta_period_starts_at
    end

    def launch_promo_period_ends_at
      Date.new(2023, 4, 30)
    end

    def beta_period_starts_at
      Date.new(2023, 2, 1)
    end

    def beta_period_ends_at
      Date.new(2023, 2, 28)
    end

    def in_beta_period?
      Current.date <= beta_period_ends_at
    end

    def in_launch_promo_period?
      Current.date <= launch_promo_period_ends_at
    end
  end
end
