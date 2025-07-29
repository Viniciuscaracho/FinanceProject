# == Schema Information
#
# Table name: subscription_invoices
#
#  id              :bigint           not null, primary key
#  data            :jsonb            not null
#  invoiced_at     :datetime
#  metadata        :jsonb            not null
#  status          :string           not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  account_id      :bigint           not null
#  processor_id    :string           not null
#  subscription_id :bigint           not null
#
# Indexes
#
#  index_subscription_invoices_on_account_id       (account_id)
#  index_subscription_invoices_on_composed_index   (account_id,subscription_id,processor_id)
#  index_subscription_invoices_on_processor_id     (processor_id) UNIQUE
#  index_subscription_invoices_on_subscription_id  (subscription_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (subscription_id => subscriptions.id)
#
require "test_helper"

class SubscriptionInvoiceTest < ActiveSupport::TestCase
  setup do
    _, _procfy_account = register_user(admin: true)
    _, @account = register_user
    @subscription = @account.subscriptions.create!(
      processor_id: 'sub_1OrPpXGwf430BbLJaRRceGiG',
      processor_product_id: 'prod_N9nsevwAo4A9Il',
      processor_plan_id: 'price_1MPUGIGwf430BbLJjDDzvlPr',
      name: 'Test Subscription',
      status: 'active',
      current_period_start: Time.current.beginning_of_day,
      current_period_end: Time.current + 30.days,
      data: { "id": "sub_1OrPpXGwf430BbLJaRRceGiG", "plan": { "id": "price_1MPUGIGwf430BbLJjDDzvlPr", "active": true, "amount": 3990, "object": "plan", "created": 1673543302, "product": "prod_N9nsevwAo4A9Il", "currency": "brl", "interval": "month", "livemode": false, "metadata": { "type": "primary", "account_type": "business", "max_active_users": "5", "max_storage_size_in_bytes": "53687091200" }, "nickname": "Plano Empresarial (Mensal)", "tiers_mode": nil, "usage_type": "licensed", "amount_decimal": "3990", "billing_scheme": "per_unit", "interval_count": 1, "aggregate_usage": nil, "transform_usage": nil, "trial_period_days": nil }, "items": { "url": "/v1/subscription_items?subscription=sub_1OrPpXGwf430BbLJaRRceGiG", "data": [{ "id": "si_PgnQsPe6Q8M9uE", "plan": { "id": "price_1MPUGIGwf430BbLJjDDzvlPr", "active": true, "amount": 3990, "object": "plan", "created": 1673543302, "product": "prod_N9nsevwAo4A9Il", "currency": "brl", "interval": "month", "livemode": false, "metadata": { "type": "primary", "account_type": "business", "max_active_users": "5", "max_storage_size_in_bytes": "53687091200" }, "nickname": "Plano Empresarial (Mensal)", "tiers_mode": nil, "usage_type": "licensed", "amount_decimal": "3990", "billing_scheme": "per_unit", "interval_count": 1, "aggregate_usage": nil, "transform_usage": nil, "trial_period_days": nil }, "price": { "id": "price_1MPUGIGwf430BbLJjDDzvlPr", "type": "recurring", "active": true, "object": "price", "created": 1673543302, "product": "prod_N9nsevwAo4A9Il", "currency": "brl", "livemode": false, "metadata": { "type": "primary", "account_type": "business", "max_active_users": "5", "max_storage_size_in_bytes": "53687091200" }, "nickname": "Plano Empresarial (Mensal)", "recurring": { "interval": "month", "usage_type": "licensed", "interval_count": 1, "aggregate_usage": nil, "trial_period_days": nil }, "lookup_key": nil, "tiers_mode": nil, "unit_amount": 3990, "tax_behavior": "unspecified", "billing_scheme": "per_unit", "custom_unit_amount": nil, "transform_quantity": nil, "unit_amount_decimal": "3990" }, "object": "subscription_item", "created": 1709752123, "metadata": {}, "quantity": 1, "tax_rates": [], "subscription": "sub_1OrPpXGwf430BbLJaRRceGiG", "billing_thresholds": nil }], "object": "list", "has_more": false, "total_count": 1 }, "object": "subscription", "status": "active", "created": 1709752123, "currency": "brl", "customer": "cus_Pb4MIb2OWbemmO", "discount": nil, "ended_at": nil, "livemode": false, "metadata": {}, "quantity": 1, "schedule": nil, "cancel_at": nil, "trial_end": nil, "start_date": 1709752123, "test_clock": nil, "application": nil, "canceled_at": nil, "description": nil, "trial_start": nil, "on_behalf_of": nil, "automatic_tax": { "enabled": false, "liability": nil }, "transfer_data": nil, "days_until_due": nil, "default_source": nil, "latest_invoice": "in_1OrPpXGwf430BbLJXOqQ1Bkz", "pending_update": nil, "trial_settings": { "end_behavior": { "missing_payment_method": "create_invoice" } }, "invoice_settings": { "issuer": { "type": "self" }, "account_tax_ids": nil }, "pause_collection": nil, "payment_settings": { "payment_method_types": nil, "payment_method_options": { "card": { "network": nil, "request_three_d_secure": "automatic" }, "konbini": nil, "acss_debit": nil, "bancontact": nil, "us_bank_account": nil, "customer_balance": nil }, "save_default_payment_method": "off" }, "collection_method": "charge_automatically", "default_tax_rates": [], "billing_thresholds": nil, "current_period_end": 1712430523, "billing_cycle_anchor": 1709752123, "cancel_at_period_end": false, "cancellation_details": { "reason": nil, "comment": nil, "feedbacks": nil }, "current_period_start": 1709752123, "pending_setup_intent": nil, "default_payment_method": "pm_1OrPpWGwf430BbLJRwfFF5xl", "application_fee_percent": nil, "billing_cycle_anchor_config": nil, "pending_invoice_item_interval": nil, "next_pending_invoice_item_invoice": nil }
    )
    @subscription_invoice = @subscription.reload.subscription_invoices.create!(
      account: @account,
      processor_id: 'in_1OrPpXGwf430BbLJXOqQ1Bkz',
      status: 'open',
      data: {"id": "in_1P3cxCGwf430BbLJrvcaKJD0", "tax": nil, "paid": true, "lines": {"url": "/v1/invoices/in_1P3cxCGwf430BbLJrvcaKJD0/lines", "data": [{"id": "il_1P3cxCGwf430BbLJDmFQDKge", "plan": {"id": "price_1MPU7JGwf430BbLJehwTHupx", "active": true, "amount": 1990, "object": "plan", "created": 1673542745, "product": "prod_N9nidQlDK4HgZy", "currency": "brl", "interval": "month", "livemode": false, "metadata": {"type": "primary", "account_type": "personal", "max_active_users": "1", "max_storage_size_in_bytes": "16106127360"}, "nickname": "Plano Pessoal (Mensal)", "tiers_mode": nil, "usage_type": "licensed", "amount_decimal": "1990", "billing_scheme": "per_unit", "interval_count": 1, "aggregate_usage": nil, "transform_usage": nil, "trial_period_days": nil}, "type": "subscription", "price": {"id": "price_1MPU7JGwf430BbLJehwTHupx", "type": "recurring", "active": true, "object": "price", "created": 1673542745, "product": "prod_N9nidQlDK4HgZy", "currency": "brl", "livemode": false, "metadata": {"type": "primary", "account_type": "personal", "max_active_users": "1", "max_storage_size_in_bytes": "16106127360"}, "nickname": "Plano Pessoal (Mensal)", "recurring": {"interval": "month", "usage_type": "licensed", "interval_count": 1, "aggregate_usage": nil, "trial_period_days": nil}, "lookup_key": nil, "tiers_mode": nil, "unit_amount": 1990, "tax_behavior": "unspecified", "billing_scheme": "per_unit", "custom_unit_amount": nil, "transform_quantity": nil, "unit_amount_decimal": "1990"}, "amount": 1990, "object": "line_item", "period": {"end": 1715254506, "start": 1712662506}, "invoice": "in_1P3cxCGwf430BbLJrvcaKJD0", "currency": "brl", "livemode": false, "metadata": {}, "quantity": 1, "discounts": [], "proration": false, "tax_rates": [], "description": "1 assinatura × Plano Pessoal (at R$ 19.90 / month)", "tax_amounts": [], "discountable": true, "subscription": "sub_1P3cxCGwf430BbLJIW8euYoM", "discount_amounts": [], "proration_details": {"credited_items": nil}, "subscription_item": "si_PtPmWRKZxqTzvF", "amount_excluding_tax": 1990, "unit_amount_excluding_tax": "1990"}], "object": "list", "has_more": false, "total_count": 1}, "quote": nil, "total": 1990, "charge": "ch_3P3cxDGwf430BbLJ0DZCa2cs", "footer": nil, "issuer": {"type": "self"}, "number": "E8CB1A82-0025", "object": "invoice", "status": "paid", "created": 1712662506, "currency": "brl", "customer": "cus_Plf7TqEZu8HFET", "discount": nil, "due_date": nil, "livemode": false, "metadata": {}, "subtotal": 1990, "attempted": true, "discounts": [], "rendering": nil, "amount_due": 1990, "period_end": 1712662506, "test_clock": nil, "amount_paid": 1990, "application": nil, "description": nil, "invoice_pdf": "https://pay.stripe.com/invoice/acct_1M2JARGwf430BbLJ/test_YWNjdF8xTTJKQVJHd2Y0MzBCYkxKLF9QdFBtQkpRWXVnRDJSUUdzTFBPYmxrV3hDUXl6bU4xLDEwMzIwMzMxMA0200qhqVvUyg/pdf?s=ap", "account_name": "PROCFY", "auto_advance": false, "effective_at": 1712662506, "from_invoice": nil, "on_behalf_of": nil, "period_start": 1712662506, "subscription": "sub_1P3cxCGwf430BbLJIW8euYoM", "attempt_count": 1, "automatic_tax": {"status": nil, "enabled": false, "liability": nil}, "custom_fields": nil, "customer_name": "Luís Felipe Venâncio de Oliveira", "shipping_cost": nil, "transfer_data": nil, "billing_reason": "subscription_create", "customer_email": "felipe0508@gmail.com", "customer_phone": "(46) 99973-6675", "default_source": nil, "ending_balance": 0, "payment_intent": "pi_3P3cxDGwf430BbLJ0AyTt4W6", "receipt_number": nil, "account_country": "BR", "account_tax_ids": nil, "amount_shipping": 0, "latest_revision": nil, "amount_remaining": 0, "customer_address": nil, "customer_tax_ids": [], "paid_out_of_band": false, "payment_settings": {"default_mandate": nil, "payment_method_types": nil, "payment_method_options": {"card": {"request_three_d_secure": "automatic"}, "konbini": nil, "acss_debit": nil, "bancontact": nil, "sepa_debit": nil, "us_bank_account": nil, "customer_balance": nil}}, "shipping_details": nil, "starting_balance": 0, "collection_method": "charge_automatically", "customer_shipping": nil, "default_tax_rates": [], "rendering_options": nil, "total_tax_amounts": [], "hosted_invoice_url": "https://invoice.stripe.com/i/acct_1M2JARGwf430BbLJ/test_YWNjdF8xTTJKQVJHd2Y0MzBCYkxKLF9QdFBtQkpRWXVnRDJSUUdzTFBPYmxrV3hDUXl6bU4xLDEwMzIwMzMxMA0200qhqVvUyg?s=ap", "status_transitions": {"paid_at": 1712662508, "voided_at": nil, "finalized_at": 1712662506, "marked_uncollectible_at": nil}, "customer_tax_exempt": "none", "total_excluding_tax": 1990, "next_payment_attempt": nil, "statement_descriptor": nil, "subscription_details": {"metadata": {}}, "webhooks_delivered_at": nil, "application_fee_amount": nil, "default_payment_method": nil, "subtotal_excluding_tax": 1990, "total_discount_amounts": [], "last_finalization_error": nil, "pre_payment_credit_notes_amount": 0, "post_payment_credit_notes_amount": 0}
    )
  end

  test "should create an invoice as paid" do
    Integrations::NuvemFiscal::EmitirNfseSubscriber.any_instance.expects(:on_subscription_invoice_paid).once
    @subscription_invoice.update!(status: 'paid')

    assert @subscription_invoice.paid?
  end
end
