# frozen_string_literal: true

module TransactionsHelper
  def amount_text_class(transaction, current_bank_account)
    return 'text-primary-500' if transaction.transfer? && transaction.transfer_to == current_bank_account
    return 'text-danger-500' if transaction.transfer? && transaction.bank_account == current_bank_account

    ''
  end

  def date_filter_options(current_month: true)

    if current_month
      {
        t('transactions.filter.range') => :range,
        t('transactions.filter.month') => :month,
        t('transactions.filter.week') => :week,
        t('transactions.filter.today') => :today,
        t('transactions.filter.yesterday') => :yesterday
      }
    else
      {
        t('transactions.filter.range') => :range
      }
    end

  end

  def payment_status_filter_options(current_month:, transaction_type: :revenue)
    if current_month.month == Current.date.month
      {
        t('transactions.filter.paid') => :paid,
        t("transactions.filter.#{transaction_type == :revenue ? transaction_type : :expenses}") => :on_time,
        t('transactions.filter.due_today') => :due_today, t('transactions.filter.delayed') => :delayed
      }
    elsif current_month.beginning_of_month > Current.date.beginning_of_month
      {
        t('transactions.filter.paid') => :paid,
        t("transactions.filter.#{transaction_type == :revenue ? transaction_type : :expenses}") => :on_time
      }
    else
      {
        t('transactions.filter.paid') => :paid,
        t("transactions.filter.#{transaction_type == :revenue ? transaction_type : :expenses}") => :on_time,
        t('transactions.filter.delayed') => :delayed
      }
    end
  end

  def transaction_filter_options
    [
      [t('transactions.filters.date'), :date],
      [t('transactions.filters.payment_status'), :payment_status],
      [t('activerecord.attributes.transaction.cost_center_id'), :cost_center],
      [t('activerecord.attributes.transaction.category_id'), :category],
      [t('activerecord.attributes.transaction.contact_id'), :contact],
    ]
  end

  def can_access_transactions?
    Transaction.transaction_types.each do |transaction_type|
      return true if Current.user.policy?(:transactions, transaction_type.first.pluralize.to_sym, :read)
    end

    false
  end

  def self.parse_str_to_cents(value:)
    if value.is_a?(String)
      value.gsub(/[,.]/, '').to_i
    else
      value
    end
  end

  # @param [String|Date] value
  # @return [Date, nil]
  def self.parse_str_to_date(value:)
    return nil if value.blank?

    case value
    when String
      return Date.parse(value) if Date.parseable?(value)

      begin
        Date.strptime(value, I18n.t('date.formats.default'))
      rescue StandardError
        nil
      end
    when Date
      value
    when Time
      value.to_date
    end
  end

  def self.calculate_due_date(transaction:, installment_number:)
    case transaction.installment_type
    when :daily
      transaction.due_date + installment_number.days
    when :weekly
      transaction.due_date + installment_number.weeks
    when :biweekly
      transaction.due_date + (2 * installment_number.weeks)
    when :monthly
      transaction.due_date + installment_number.months
    when :bimonthly
      transaction.due_date + (2 * installment_number.months)
    when :quarterly
      transaction.due_date + (3 * installment_number.months)
    when :semiannual
      transaction.due_date + (6 * installment_number.months)
    else
      transaction.due_date + installment_number.years
    end
  end

  def transactions_search_form(form_params:)
    render(Page::SearchFormComponent.new(
      url: transactions_path,
      value: params[:q],
      options: { params: form_params }
    ))
  end

  def select_without_transfer(value)
    value.to_sym.in?(%i[revenue fixed_expense variable_expense payroll tax])
  end

  def select_only_transfer(value)
    value.to_sym == :transfer
  end

  def build_url_for_transaction(transaction)
    details_transaction_path(transaction)
    # transaction.child? ? edit_amount_details_transaction_path(transaction.parent) : details_transaction_path(transaction)
  end

  def build_turbo_frame_for_transaction(_transaction)
    :drawer
    # transaction.child? ? :modal : :drawer
  end

  def transaction_amount_disabled?(transaction)
    !transaction.simple? || transaction.invoice_present?
  end

  def transactions_list_data
    {
      controller: 'transactions-checkbox',
      transactions_checkbox_suspend_value: 'false',
      transactions_checkbox_sum_url_value: sum_transactions_url(params: { transaction_type: @current_transaction_type }),
      transactions_checkbox_delete_url_value: bulk_destroy_transactions_url,
      transactions_checkbox_transaction_type_value: @current_transaction_type,
      transactions_checkbox_move_to_url_value: bulk_move_to_options_transactions_url(params: { bank_account_id: @current_bank_account, transaction_type: @current_transaction_type }),
      transactions_checkbox_mark_as_paid_url_value: bulk_mark_as_paid_transactions_url,
      transactions_checkbox_update_url_value: bulk_update_options_transactions_url(params: { transaction_type: @current_transaction_type }),
      transactions_checkbox_duplicate_url_value: bulk_duplicate_transactions_url
    }
  end
end
