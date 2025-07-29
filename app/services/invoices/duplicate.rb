# frozen_string_literal: true

module Invoices
  class Duplicate < ApplicationService
    def call
      context.duplicated_invoice = context.invoice.dup.tap do |invoice|
        invoice.record = nil
        invoice.number = nil
        invoice.lines = context.invoice.lines.map(&:dup).map do |line|
          line.record = nil
          line.invoice = nil
          line
        end
        invoice.status = :draft
        invoice.sent_at = nil
        invoice.sent_at = nil
        invoice.paid_at = nil
        invoice.canceled_at = nil
      end

      context.duplicated_invoice.calculate_total
    end
  end
end
