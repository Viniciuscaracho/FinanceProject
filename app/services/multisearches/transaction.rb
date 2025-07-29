# frozen_string_literal: true

class Multisearches::Transaction < ApplicationService
  def call
    current_account = context.current_account
    current_query = context.current_query
    current_filter = context.current_filters

    query = Current.account.transactions.only_simple_and_children
    query = query.where(bank_account: current_account.bank_accounts.kept)
    query = query.includes(:bank_account, :transfer_to, :contact, :category, :attachments_attachments, { taggings: :tag })
    query = query.search_by_q(current_query)

    query = apply_filters(query, current_filter)

    context.query = query
  end

  private

  def apply_filters(query, current_filter)
    query = apply_date_filter(query, current_filter) if current_filter[:date_enabled]
    query = apply_payment_status_filter(query, current_filter) if current_filter[:payment_status_enabled]
    query = apply_cost_center_filter(query, current_filter) if current_filter[:cost_center_enabled]
    query = apply_category_filter(query, current_filter) if current_filter[:category_enabled]
    query = apply_contact_filter(query, current_filter) if current_filter[:contact_enabled]
    query = apply_value_filter(query, current_filter) if current_filter[:value_filter_enabled]

    query
  end

  def apply_date_filter(query, current_filter)
    query.where(due_date: current_filter[:start_date]..current_filter[:end_date])
  end

  def apply_payment_status_filter(query, current_filter)

    case current_filter[:payment_status_filter]
    when 'paid'
      query.only_paid
    when 'on_time'
      query.on_time.or(query.delayed).or(query.last_day)
    when 'due_today'
      query.last_day
    when 'delayed'
      query.delayed
    else
      query
    end
  end

  def apply_cost_center_filter(query, current_filter)
    query.where(cost_center_id: current_filter[:cost_center_id].compact_blank.reject(&:blank?).map { |i| i == '-1' ? nil : i })
  end

  def apply_category_filter(query, current_filter)
    query.where(category_id: current_filter[:category_id].compact_blank.reject(&:blank?).map { |i| i == '-1' ? nil : i })
  end

  def apply_contact_filter(query, current_filter)
    query.where(contact_id: current_filter[:contact_id].compact_blank.reject(&:blank?).map { |i| i == '-1' ? nil : i })
  end

  def apply_value_filter(query, current_filter)
    min_value = TransactionsHelper.parse_str_to_cents(value: current_filter[:min_value_filter])
    max_value = TransactionsHelper.parse_str_to_cents(value: current_filter[:max_value_filter])

    query.by_value(min_value:, max_value:)
  end

end
