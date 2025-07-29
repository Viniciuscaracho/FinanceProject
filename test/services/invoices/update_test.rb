# frozen_string_literal: true

require 'test_helper'

module Invoices
  class UpdateTest < ActiveSupport::TestCase
    setup do
      _, @account   = register_user
      @bank_account = @account.default_bank_account
      @contact      = create_contact @account
      @service1     = create_service @account
      @service2     = create_service @account
      @invoice      = create_invoice(
        @account, @contact, @bank_account, lines_attributes: [
          { offer_id: @service1.id, quantity: 1, unit_price_cents: 10_000 }, # 100.00
          { offer_id: @service2.id, quantity: 2, unit_price_cents: 20_000 }, # 200.00
          { description: 'Line 3', quantity: 3, unit_price_cents: 30_000 } # 300.00
        ]
      )
    end

    test 'should update an invoice from draft to open' do
      old_status = @invoice.status
      result = Invoices::Update.call(
        invoice: @invoice,
        invoice_params: { status: :open }
      )

      invoice = result.invoice

      assert result.success?
      assert_equal :draft, old_status
      assert_equal :open, invoice.status
      assert_not_equal old_status, invoice.status
    end

    test 'should update an invoice and lines' do
      result = Invoices::Update.call(
        invoice: @invoice,
        action: 'mark_as_paid',
        invoice_params: {
          due_date: Date.current + 10.days,
          lines_attributes: [
            { id: @invoice.lines.first.id, _destroy: true },
            { id: @invoice.lines.second.id, quantity: 2.5 },
            { id: @invoice.lines.third.id, unit_price_cents: 40_000 }
          ]
        }
      )

      invoice = result.invoice.reload

      assert result.success?
      assert_equal :paid, invoice.status
      assert_equal Date.current + 10.days, invoice.due_date
      assert_equal 2, invoice.lines.count
      assert_equal [2.5, 3], invoice.lines.pluck(:quantity)
      assert_equal [20_000, 40_000], invoice.lines.pluck(:unit_price_cents)
      assert_equal [50_000, 120_000], invoice.lines.pluck(:total_price_cents)
      assert_equal 170_000, invoice.subtotal_cents
    end
  end
end
