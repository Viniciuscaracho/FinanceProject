# frozen_string_literal: true

require 'test_helper'

module Invoices
  class SearchTest < ActiveSupport::TestCase
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

    test 'should search an invoice successfully' do
      result = Invoices::Search.call(
        account: @account,
        current_period: @invoice.issue_date..@invoice.issue_date,
        current_bank_account_ids: [@bank_account.id],
        current_contact_ids: [@contact.id]
      )

      invoices = result.query

      assert result.success?
      assert_equal 1, invoices.count
      assert_equal [1], invoices.order(:number).map(&:number)
      assert_equal [@invoice.issue_date], invoices.map(&:issue_date)
      assert_equal [@invoice.total_cents], invoices.map(&:total_cents)
    end

    test 'should search two invoices successfully' do
      @invoice2 = create_invoice(
        @account, @contact, @bank_account, status: :open,
                                           lines_attributes: [
                                             { offer_id: @service1.id, quantity: 2, unit_price_cents: 10_000 }, # 100.00
                                             { offer_id: @service2.id, quantity: 2, unit_price_cents: 20_000 }, # 200.00
                                             { description: 'Line 3', quantity: 4, unit_price_cents: 30_000 } # 300.00
                                           ]
      )

      result = Invoices::Search.call(
        account: @account,
        current_period: @invoice.issue_date..@invoice.issue_date,
        current_bank_account_ids: [@bank_account.id],
        current_contact_ids: [@contact.id],
        current_statuses: %w[draft open]
      )

      invoices = result.query

      assert result.success?
      assert_equal 2, invoices.count
      assert_equal [1, 2], invoices.order(number: :asc).map(&:number)
      assert_equal [@invoice.issue_date, @invoice2.issue_date], invoices.map(&:issue_date)
      assert_equal [@invoice.total_cents, @invoice2.total_cents].sort, invoices.map(&:total_cents).sort
      assert_equal [@invoice.status, @invoice2.status].sort, invoices.map(&:status).map(&:to_sym).sort
    end

    test 'should search an opened invoice successfully' do
      @invoice2 = create_invoice(
        @account, @contact, @bank_account, status: :open,
                                           lines_attributes: [
                                             { offer_id: @service1.id, quantity: 2, unit_price_cents: 10_000 }, # 100.00
                                             { offer_id: @service2.id, quantity: 2, unit_price_cents: 20_000 }, # 200.00
                                             { description: 'Line 3', quantity: 4, unit_price_cents: 30_000 } # 300.00
                                           ]
      )

      result = Invoices::Search.call(
        account: @account,
        current_period: @invoice.issue_date..@invoice.issue_date,
        current_bank_account_ids: [@bank_account.id],
        current_contact_ids: [@contact.id],
        current_statuses: %w[open]
      )

      invoices = result.query

      assert result.success?
      assert_equal 1, invoices.count
      assert_equal [2], invoices.map(&:number)
      assert_equal [@invoice2.issue_date], invoices.map(&:issue_date)
      assert_equal [@invoice2.total_cents], invoices.map(&:total_cents)
      assert_equal [@invoice2.status], invoices.map(&:status).map(&:to_sym)
    end

    test 'should search a paid invoice successfully' do
      @invoice2 = create_invoice(
        @account, @contact, @bank_account, status: :paid,
                                           lines_attributes: [
                                             { offer_id: @service1.id, quantity: 2, unit_price_cents: 10_000 }, # 100.00
                                             { offer_id: @service2.id, quantity: 2, unit_price_cents: 20_000 }, # 200.00
                                             { description: 'Line 3', quantity: 4, unit_price_cents: 30_000 } # 300.00
                                           ]
      )

      result = Invoices::Search.call(
        account: @account,
        current_period: @invoice.issue_date..@invoice.issue_date,
        current_bank_account_ids: [@bank_account.id],
        current_contact_ids: [@contact.id],
        current_statuses: %w[paid]
      )

      invoices = result.query

      assert result.success?
      assert_equal 1, invoices.count
      assert_equal [2], invoices.map(&:number)
      assert_equal [@invoice2.issue_date], invoices.map(&:issue_date)
      assert_equal [@invoice2.total_cents], invoices.map(&:total_cents)
      assert_equal [@invoice2.status], invoices.map(&:status).map(&:to_sym)
    end

    test 'should search a canceled invoice successfully' do
      @invoice2 = create_invoice(
        @account, @contact, @bank_account, status: :canceled,
                                           lines_attributes: [
                                             { offer_id: @service1.id, quantity: 2, unit_price_cents: 10_000 }, # 100.00
                                             { offer_id: @service2.id, quantity: 2, unit_price_cents: 20_000 }, # 200.00
                                             { description: 'Line 3', quantity: 4, unit_price_cents: 30_000 } # 300.00
                                           ]
      )

      result = Invoices::Search.call(
        account: @account,
        current_period: @invoice.issue_date..@invoice.issue_date,
        current_bank_account_ids: [@bank_account.id],
        current_contact_ids: [@contact.id],
        current_statuses: %w[canceled]
      )

      invoices = result.query

      assert result.success?
      assert_equal 1, invoices.count
      assert_equal [2], invoices.map(&:number)
      assert_equal [@invoice2.issue_date], invoices.map(&:issue_date)
      assert_equal [@invoice2.total_cents], invoices.map(&:total_cents)
      assert_equal [@invoice2.status], invoices.map(&:status).map(&:to_sym)
    end
  end
end
