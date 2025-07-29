module ReportsHelper

  NUM_ITEMS_TO_SHOW = 6

  def order_value(current_order:)
    case current_order
    when :asc
      :desc
    when :desc
      nil
    else
      :asc
    end
  end

  def sanitize_items(items:, order:)
    other_items = items.first(NUM_ITEMS_TO_SHOW).to_h
    other_items[[I18n.t('shared.others'), nil]] = other_items_sum(items: items) if items.size > NUM_ITEMS_TO_SHOW
    other_items.sort_by { |_key, value| order == :asc ? value : -value }.to_h
  end

  def sanitize_chart_data(chart_data:)
    chart_data.transform_keys do |key|
      if key.is_a?(Array)
        if key.size == 3
          key.first ? [key.first, key.second].join(' ') : I18n.t('shared.not_informed_female')
        else
          key.first || I18n.t('shared.not_informed_female')
        end
      else
        key || I18n.t('shared.not_informed_female')
      end
    end
  end


  def other_items_sum(items:)
    items.except(*items.first(NUM_ITEMS_TO_SHOW).to_h.keys).values.sum
  end

  def order_icon(current_order:)
    if current_order.blank?
      'chevron-up-down'
    else
      current_order == :asc ? 'chevron-down' : 'chevron-up'
    end
  end

  def extract_columns
    [
      [I18n.t('activerecord.attributes.transaction.paid'), :paid],
      [I18n.t('activerecord.attributes.transaction.due_date'), :date],
      [I18n.t('activerecord.attributes.transaction.name'), :description],
      [I18n.t('activerecord.attributes.transaction.category_id'), :category],
      [I18n.t('activerecord.attributes.transaction.cost_center_id'), :cost_center],
      [I18n.t('activerecord.attributes.transaction.document_number'), :document_number],
      [I18n.t('activerecord.attributes.transaction.payment_method'), :payment_method],
      [I18n.t('activerecord.attributes.transaction.amount'), :amount],
      [I18n.t('reports.extract.balance'), :balance],
    ]
  end

  def extract_default_columns
    [:paid, :date, :description, :category, :amount, :balance]
  end

  def comparative_columns
    [
      [I18n.t('activerecord.attributes.transaction.paid'), :paid],
      [I18n.t('activerecord.attributes.transaction.due_date'), :date],
      [I18n.t('activerecord.attributes.transaction.name'), :description],
      [[I18n.t('reports.comparative.received_from'), I18n.t('reports.comparative.paid_to')].join(' / '), :contact],
      [I18n.t('activerecord.attributes.transaction.category_id'), :category],
      [I18n.t('activerecord.attributes.transaction.cost_center_id'), :cost_center],
      [I18n.t('activerecord.attributes.transaction.document_number'), :document_number],
      [I18n.t('activerecord.attributes.transaction.payment_method'), :payment_method],
      [I18n.t('activerecord.attributes.transaction.amount'), :amount],
      [I18n.t('reports.extract.balance'), :balance],
      [I18n.t('reports.comparative.origin'), :origin],
      [I18n.t('reports.comparative.destiny'), :transfer_to]

    ]
  end

  def comparative_default_columns
    [:paid, :date, :description, :contact, :category, :amount, :balance, :origin, :transfer_to]
  end
end