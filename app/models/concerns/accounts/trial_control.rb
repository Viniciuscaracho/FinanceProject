# frozen_string_literal: true

module Accounts
  module TrialControl
    extend ActiveSupport::Concern

    included do
      before_validation :set_trial_ends_at, on: :create
    end

    def trial_period?
      trial? && (trial_ends_at || Date.current) >= Date.current
    end

    def trial_expired?
      trial? && (trial_ends_at || Date.current) < Date.current
    end

    def trial_period_in_days
      return 0 if trial_ends_at.blank?

      (Date.current - trial_ends_at).to_i.abs
    end

    def default_trial_days
      30.days
    end

    def default_personal_trial_days
      14.days
    end

    protected

    def set_trial_ends_at
      return if personal? && free?

      self.free  = false
      self.trial = true
      self.subscription_status = :incomplete
      self.trial_ends_at = Date.current + default_trial_days
    end

    def restart_trial_period
      self.trial_ends_at ||= (Date.current + default_personal_trial_days)
      self.free = false
      self.trial = true
      self.subscription_status = :incomplete
    end
  end
end
