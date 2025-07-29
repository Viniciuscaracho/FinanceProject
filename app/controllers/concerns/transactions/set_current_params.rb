# frozen_string_literal: true

module Transactions
  module SetCurrentParams
    extend ActiveSupport::Concern

    included do
      before_action :set_current_month
      before_action :set_current_sort
      before_action :set_current_bank_account
      before_action :set_current_transaction_type
      before_action :set_current_grouped_expenses
      before_action :set_current_chart_range
      before_action :set_payment_status_enabled
      before_action :set_date_enabled
      before_action :set_cost_center_enabled
      before_action :set_category_enabled
      before_action :set_contact_enabled
      before_action :set_current_start_date
      before_action :set_current_end_date
      before_action :set_current_date_filter
      before_action :set_current_cost_center_ids
      before_action :set_current_category_ids
      before_action :set_current_contact_ids
      before_action :set_selected_transaction_filter_options
      before_action :set_current_payment_status_filter
      before_action :set_current_value_filter
      before_action :set_current_value_filter_enabled
      before_action :set_current_required_params

      helper_method :default_expense
    end

    def default_expense
      @current_transaction_type == :all_expenses ? :variable_expense : @current_transaction_type
    end

    protected

    def set_current_date_filter
      @current_date_filter =
        if @current_month == Date.current.beginning_of_month
          params.fetch(:date_filter, :month)&.to_sym
        else
          :range
        end

      set_current_date_based_on_date_filter
    end

    def set_current_date_based_on_date_filter
      unless @date_enabled
        @current_date_filter = :range
        @current_start_date = @current_month.beginning_of_month
        @current_end_date = @current_month.end_of_month
        return
      end

      case @current_date_filter
      when :today
        @current_start_date = @current_end_date = Time.zone.today
      when :yesterday
        @current_start_date = @current_end_date = Time.zone.yesterday
      when :week
        @current_start_date = Time.zone.today.beginning_of_week
        @current_end_date = Time.zone.today.end_of_week > Time.zone.today.end_of_month ? Time.zone.today.end_of_month : Time.zone.today.end_of_week
      when :range
        @current_start_date = params.fetch(:start_date, @current_month.beginning_of_month)&.to_date
        @current_end_date = params.fetch(:end_date, @current_month.end_of_month)&.to_date
      when :month
        @current_start_date = @current_month
        @current_end_date = @current_month.end_of_month
      end
    end

    def set_current_start_date
      @current_start_date = params.fetch(:start_date, Time.zone.today.beginning_of_month)&.to_date
    end

    def set_current_end_date
      @current_end_date = params.fetch(:end_date, Time.zone.today.end_of_month)&.to_date
    end

    def set_current_payment_status_filter
      @current_payment_status_filter = params.fetch(:payment_status_filter, nil)
    end

    def set_current_sort
      @current_sort = params.fetch(:sort, nil)
      @current_direction = params.fetch(:direction, nil)
    end

    def set_current_cost_center_ids
      @current_cost_center_ids = params.fetch(:cost_center_id, nil)
    end

    def set_current_category_ids
      @current_category_ids = params.fetch(:category_id, nil)
    end

    def set_current_contact_ids
      @current_contact_ids = params.fetch(:contact_id, nil)
    end

    def set_selected_transaction_filter_options
      @selected_transaction_filter_options = params.fetch(:transaction_filter, [])
    end

    def set_payment_status_enabled
      @payment_status_enabled = !params.fetch(:payment_status_enabled, 0).to_i.zero?
    end

    def set_date_enabled
      @date_enabled = !params.fetch(:date_enabled, 0).to_i.zero?
    end

    def set_cost_center_enabled
      @cost_center_enabled = !params.fetch(:cost_center_enabled, 0).to_i.zero?
    end

    def set_category_enabled
      @category_enabled = !params.fetch(:category_enabled, 0).to_i.zero?
    end

    def set_contact_enabled
      @contact_enabled = !params.fetch(:contact_enabled, 0).to_i.zero?
    end

    # Callbacks
    def set_current_month
      month_param = params[:month]
      @current_month = month_param.present? ? month_param.to_date.beginning_of_month : Date.current.beginning_of_month
    end

    def set_current_bank_account
      bank_account_id = params.fetch(:bank_account_id, current_user.all_bank_accounts? ? 'all' : Current.account.default_bank_account.id)
      @current_bank_account = bank_account_id == 'all' ? nil : Current.account.bank_accounts.find(bank_account_id)
    end

    def set_current_transaction_type
      @current_transaction_type = params.fetch(:transaction_type, default_transaction_type).to_sym
    end

    def current_transaction_types
      if @current_grouped_expenses && @current_transaction_type.to_sym == :all_expenses
        %i[fixed_expense variable_expense payroll tax]
      else
        [@current_transaction_type.to_sym]
      end
    end

    def set_current_grouped_expenses
      @current_grouped_expenses = if can?(:read, :all_expenses)
                                    params.fetch(:grouped_expenses, default_grouped_expenses).to_boolean
                                  else
                                    false
                                  end
      return if @current_grouped_expenses == default_grouped_expenses

      ActiveRecord::Base.connected_to(role: ActiveRecord.writing_role) do
        Current.user.settings(:transactions).update(grouped_expenses: @current_grouped_expenses)
      end
    end

    def set_current_value_filter
      @current_min_value_filter = params.fetch(:min_value_filter, nil)
      @current_max_value_filter = params.fetch(:max_value_filter, nil)
    end

    def set_current_value_filter_enabled
      @value_filter_enabled = !params.fetch(:value_filter_enabled, 0).to_i.zero?
    end

    def default_transaction_type
      Transaction.transaction_types.each do |transaction_type|
        tt = transaction_type.first
        return tt.to_sym if Current.user.policy?(:transactions, tt.pluralize.to_sym, :read)
      end

      redirect_to redirect_if_access_forbidden
    end

    def set_current_required_params
      @current_required_params = {
        month: @current_month,
        bank_account_id: @current_bank_account&.id || 'all',
        transaction_type: @current_transaction_type,
        sort: @current_sort,
        direction: @current_direction,
        date_filter: @current_date_filter,
        payment_status_filter: @current_payment_status_filter,
        start_date: @current_start_date,
        end_date: @current_end_date,
        cost_center_id: @current_cost_center_ids,
        category_id: @current_category_ids,
        contact_id: @current_contact_ids,
        transaction_filter: @selected_transaction_filter_options,
        payment_status_enabled: @payment_status_enabled.to_i,
        date_enabled: @date_enabled.to_i,
        cost_center_enabled: @cost_center_enabled.to_i,
        category_enabled: @category_enabled.to_i,
        contact_enabled: @contact_enabled.to_i

      }
      @current_required_params[:grouped_expenses] = @current_grouped_expenses if can?(:read, :all_expenses)
      @current_required_params[:q] = params[:q] if params[:q].present?

    end

    def set_current_chart_range
      @current_chart_range = (@current_month - 1.month).beginning_of_month..(@current_month + 1.month).end_of_month
    end

    def transaction_type_defined?
      transaction_type = params[:transaction_type]&.to_sym
      transaction_type.present? && Transaction.transaction_types.include?(transaction_type)
    end

    def default_grouped_expenses
      settings_grouped_expenses = Current.user.settings(:transactions).grouped_expenses || false
      if can?(:read, :all_expenses)
        settings_grouped_expenses
      else
        false
      end
    end

  end
end
