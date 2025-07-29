# frozen_string_literal: true

class MultisearchesController < ApplicationController
  before_action :set_current_query
  before_action :set_current_tab
  before_action :set_current_date
  before_action :set_date_filter
  before_action :set_current_payment_status_filter
  before_action :set_current_cost_center_filter
  before_action :set_current_category_filter
  before_action :set_current_contact_filter
  before_action :set_value_filter
  before_action :set_current_filters

  def index
    authorize! :read, :advanced_search

    if @current_query.blank?
      @transactions_count = 0
      @contacts_count = 0
      @categories_count = 0
      @cost_centers_count = 0
      @attachments_count = 0

      return
    end

    @transactions_count = transactions_count
    @contacts_count = Current.account.contacts.search_by_q(@current_query).count
    @categories_count = Current.account.categories.search_by_q(@current_query).count
    @cost_centers_count = Current.account.cost_centers.search_by_q(@current_query).count
    @attachments_count = Current.account.attachments.search_by_q(@current_query).count

    set_current_tab_by_data if @current_tab.blank?
  end

  def transactions
    result = Multisearches::Transaction.call(
      current_account: Current.account,
      current_query: @current_query,
      current_filters: {
        date_enabled: @date_enabled,
        date_filter: @current_date_filter,
        start_date: @current_start_date,
        end_date: @current_end_date,
        payment_status_enabled: @payment_status_enabled,
        payment_status_filter: @current_payment_status_filter,
        cost_center_enabled: @cost_center_enabled,
        cost_center_id: @current_cost_center_id,
        category_enabled: @category_enabled,
        category_id: @current_category_id,
        contact_enabled: @contact_enabled,
        contact_id: @current_contact_id,
        value_filter_enabled: @value_filter_enabled,
        min_value_filter: @current_min_value_filter,
        max_value_filter: @current_max_value_filter
      }
    )

    after = params[:after].presence&.to_s
    @pagination = RailsCursorPagination::Paginator.new(result.query, after:, limit: 30, order_by: :due_date, order: :desc).fetch
  end

  def contacts
    @pagy, @records = pagy_countless(Current.account.contacts.order(first_name: :asc,
                                                                    last_name: :asc).search_by_q(@current_query))
  end

  def categories
    @pagy, @records = pagy_countless(Current.account.categories.order(name: :asc).search_by_q(@current_query))
  end

  def cost_centers
    @pagy, @records = pagy_countless(Current.account.cost_centers.order(name: :asc).search_by_q(@current_query))
  end

  def attachments
    @pagy, @records = pagy_countless(Current.account.attachments.search_by_q(@current_query))
  end
  def transaction_actions
    @transaction = Current.account.transactions.find(params[:transaction_id])
  end

  private

  def set_current_query
    @current_query = params[:q]
  end

  def set_current_tab
    @current_tab = params.fetch(:tab, '')
  end

  def set_date_filter
    @date_enabled = !params.fetch(:date_enabled, 0).to_i.zero?
    @current_date_filter = params.fetch(:date_filter, 'range')

    case @current_date_filter
    when 'range'
      @current_start_date, @current_end_date = params[:date_picker_data_range].split(' - ').map(&:to_date) if params[:date_picker_data_range].present?
    when 'month'
      @current_start_date = Time.zone.today.beginning_of_month
      @current_end_date = Time.zone.today.end_of_month
    when 'week'
      @current_start_date = Time.zone.today.beginning_of_week
      @current_end_date = Time.zone.today.end_of_week > Time.zone.today.end_of_month ? Time.zone.today.end_of_month : Time.zone.today.end_of_week
    when 'today'
      @current_start_date = Time.zone.today
      @current_end_date = Time.zone.today
    when 'yesterday'
      @current_start_date = Time.zone.yesterday
      @current_end_date = Time.zone.yesterday
    end

  end

  def set_current_payment_status_filter
    @payment_status_enabled = !params.fetch(:payment_status_enabled, 0).to_i.zero?
    @current_payment_status_filter = params.fetch(:payment_status_filter, nil)
  end

  def set_current_cost_center_filter
    @cost_center_enabled = !params.fetch(:cost_center_enabled, 0).to_i.zero?
    @current_cost_center_id = params.fetch(:cost_center_id, nil)
  end

  def set_current_category_filter
    @category_enabled = !params.fetch(:category_enabled, 0).to_i.zero?
    @current_category_id = params.fetch(:category_id, nil)
  end

  def set_current_contact_filter
    @contact_enabled = !params.fetch(:contact_enabled, 0).to_i.zero?
    @current_contact_id = params.fetch(:contact_id, nil)
  end

  def set_value_filter
    @value_filter_enabled = !params.fetch(:value_filter_enabled, 0).to_i.zero?
    @current_min_value_filter = params.fetch(:min_value_filter, nil)
    @current_max_value_filter = params.fetch(:max_value_filter, nil)
  end

  def set_current_filters

    @current_filters = {
      date_enabled: params.fetch(:date_enabled, 0).to_i,
      date_filter: params.fetch(:date_filter, 'range'),
      date_picker_data_range: params.fetch(:date_picker_data_range, ''),
      payment_status_enabled: params.fetch(:payment_status_enabled, 0).to_i,
      payment_status_filter: params.fetch(:payment_status_filter, nil),
      cost_center_enabled: params.fetch(:cost_center_enabled, 0).to_i,
      cost_center_id: params.fetch(:cost_center_id, nil),
      category_enabled: params.fetch(:category_enabled, 0).to_i,
      category_id: params.fetch(:category_id, nil),
      contact_enabled: params.fetch(:contact_enabled, 0).to_i,
      contact_id: params.fetch(:contact_id, nil),
      value_filter_enabled: params.fetch(:value_filter_enabled, 0).to_i,
      min_value_filter: params.fetch(:min_value_filter, nil),
      max_value_filter: params.fetch(:max_value_filter, nil)
    }
  end

  def set_current_date
    @current_start_date = params.fetch(:start_date, Time.zone.today.beginning_of_month)&.to_date
    @current_end_date = params.fetch(:end_date, Time.zone.today.end_of_month)&.to_date
  end

  def set_current_tab_by_data
    @current_tab = if @transactions_count.positive?
                     'transactions'
                   elsif @contacts_count.positive?
                     'contacts'
                   elsif @categories_count.positive?
                     'categories'
                   elsif @cost_centers_count.positive?
                     'cost_centers'
                   elsif @attachments_count.positive?
                     'attachments'
                   end
  end

  def transactions_count
    Multisearches::Transaction.call(
      current_account: Current.account,
      current_query: @current_query,
      current_filters: {
        date_enabled: @date_enabled,
        date_filter: @current_date_filter,
        start_date: @current_start_date,
        end_date: @current_end_date,
        payment_status_enabled: @payment_status_enabled,
        payment_status_filter: @current_payment_status_filter,
        cost_center_enabled: @cost_center_enabled,
        cost_center_id: @current_cost_center_id,
        category_enabled: @category_enabled,
        category_id: @current_category_id,
        contact_enabled: @contact_enabled,
        contact_id: @current_contact_id,
        value_filter_enabled: @value_filter_enabled,
        min_value_filter: @current_min_value_filter,
        max_value_filter: @current_max_value_filter
      }
    ).query.limit(101).count
  end
end
