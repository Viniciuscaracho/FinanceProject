# frozen_string_literal: true

module Invoices
  module Workflow
    extend ActiveSupport::Concern

    STATUSES = %i[draft open paid canceled].freeze

    included do
      as_enum :status, STATUSES, map: :string, source: :status

      after_initialize :set_default_status
    end

    def mark_as_open!
      self.status = :open
      self.opened_at = Time.zone.now
      save
    end

    def mark_as_paid!
      self.status = :paid
      self.paid_at = Time.zone.now
      save
    end

    def mark_as_unpaid!
      self.status = :open
      self.paid_at = nil
      self.opened_at = Time.zone.now
      save
    end

    def mark_as_canceled!
      self.status = :canceled
      self.canceled_at = Time.zone.now
      self.record = nil
      save
    end

    protected

    def set_default_status
      self.status ||= :draft
    end
  end
end
