# frozen_string_literal: true

require 'test_helper'

module Invoices
  class CreateTest < ActiveSupport::TestCase
    setup do
      _, @account   = register_user
      @bank_account = @account.default_bank_account
      @contact      = create_contact @account
      @service1     = create_service @account
      @service2     = create_service @account
    end

    test 'should create an invoice successfully' do
      result = Invoices::Create.call(
        account: @account,
        invoice_params: {
          recipient: @contact,
          bank_account: @bank_account,
          issue_date: Date.current,
          due_date: Date.current + 5.days,
          description: Faker::Lorem.paragraph,
          tax_percentage: 14.5, # 60.00
          discount_percentage: 10, # 10.00
          tax_already_applied: true,
          lines_attributes: [
            { offer_id: @service1.id, quantity: 1, unit_price_cents: 10_000 }, # 100.00
            { offer_id: @service2.id, quantity: 1, unit_price_cents: 20_000 }, # 200.00
            { description: 'Line 3',  quantity: 1, unit_price_cents: 30_000 }  # 300.00
          ]
        }
      )

      invoice = result.invoice.reload

      assert result.success?
      assert_equal 3, invoice.lines.count
      assert_equal [@service1.name, @service2.name, 'Line 3'].sort, invoice.lines.map(&:description).sort
      assert_equal [1, 2, 3], invoice.lines.order(:sequential_id).map(&:sequential_id).sort
      assert_equal [10_000, 20_000, 30_000], invoice.lines.map(&:unit_price_cents).sort
      assert_equal [10_000, 20_000, 30_000], invoice.lines.map(&:total_price_cents).sort
      assert_equal 60_000, invoice.subtotal_cents
      assert_equal 7_830, invoice.tax_cents
      assert_equal 6_000, invoice.discount_cents
      assert_equal 60_000, invoice.subtotal_cents
      assert_equal 54_000, invoice.total_cents
      assert_equal 1, invoice.number
      assert_equal Date.current, invoice.issue_date
      assert_equal Date.current + 5.days, invoice.due_date
      assert_equal @account.company, invoice.provider
      assert_equal @contact, invoice.recipient
      assert_equal @bank_account, invoice.bank_account
      assert_equal 1, @account.invoices.count
    end

    test 'should create an opened invoice successfully' do
      result = Invoices::Create.call(
        account: @account,
        invoice_params: {
          recipient: @contact,
          bank_account: @bank_account,
          status: :open,
          issue_date: Date.current,
          due_date: Date.current + 5.days,
          description: Faker::Lorem.paragraph,
          tax_cents: 6_000, # 60.00
          discount_cents: 1_000, # 10.00
          lines_attributes: [
            { offer_id: @service1.id, quantity: 1, unit_price_cents: 10_000 }, # 100.00
            { offer_id: @service2.id, quantity: 1, unit_price_cents: 20_000 }, # 200.00
            { description: 'Line 3',  quantity: 1, unit_price_cents: 30_000 }  # 300.00
          ]
        }
      )

      invoice = result.invoice

      assert result.success?
      assert_equal :open, invoice.status
    end

    test 'should create a paid invoice successfully' do
      result = Invoices::Create.call(
        account: @account,
        invoice_params: {
          recipient: @contact,
          bank_account: @bank_account,
          status: :paid,
          issue_date: Date.current,
          due_date: Date.current + 5.days,
          description: Faker::Lorem.paragraph,
          tax_cents: 6_000, # 60.00
          discount_cents: 1_000, # 10.00
          lines_attributes: [
            { offer_id: @service1.id, quantity: 1, unit_price_cents: 10_000 }, # 100.00
            { offer_id: @service2.id, quantity: 1, unit_price_cents: 20_000 }, # 200.00
            { description: 'Line 3',  quantity: 1, unit_price_cents: 30_000 }  # 300.00
          ]
        }
      )

      invoice = result.invoice

      assert result.success?
      assert_equal :paid, invoice.status
    end

    test 'should not create an invoice with errors' do
      result = Invoices::Create.call(
        account: @account,
        invoice_params: {
          recipient: nil,
          bank_account: @bank_account,
          issue_date: Date.current,
          due_date: nil,
          description: Faker::Lorem.paragraph,
          tax_cents: 6_000, # 60.00
          discount_cents: 1_000, # 10.00
          lines_attributes: [
            { offer_id: @service1.id, quantity: nil, unit_price_cents: 10_000 }, # 100.00
            { offer_id: @service2.id, quantity: 1, unit_price_cents: nil }, # 200.00
            { description: 'Line 3',  quantity: 1, unit_price_cents: 30_000 }  # 300.00
          ]
        }
      )

      invoice = result.invoice

      assert_not result.success?
      assert_equal 3, invoice.errors.count
      assert_equal [
        'Cliente não pode ficar em branco',
        'Cliente é obrigatório(a)',
        'Data vencimento não pode ficar em branco'
      ].sort, invoice.errors.full_messages.sort
    end

    test 'should not create an invoice with empty lines' do
      result = Invoices::Create.call(
        account: @account,
        invoice_params: {
          recipient: @contact,
          bank_account: @bank_account,
          issue_date: Date.current,
          due_date: Date.current + 5.days,
          description: Faker::Lorem.paragraph,
          tax_cents: 6_000, # 60.00
          discount_cents: 1_000, # 10.00
          lines_attributes: []
        }
      )

      invoice = result.invoice

      assert_not result.success?
      assert_equal 1, invoice.errors.count
      assert_equal ['Itens da fatura não pode ficar em branco'], invoice.errors.full_messages
    end
  end
end
