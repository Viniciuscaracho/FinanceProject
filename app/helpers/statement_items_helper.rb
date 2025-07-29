module StatementItemsHelper
  def statement_item_status_badge(statement_item)
    if statement_item.suggested?
      'badge--purple'
    elsif statement_item.confirmed?
      'badge--success'
    elsif statement_item.reconciled?
      'badge--primary'
    else
      statement_item.ignored? ? 'badge--warning' : 'badge--gray'
    end
  end

  def statement_item_type_badge(statement_item)
    if statement_item.credit?
      'text-primary-500'
    else
      'text-danger-500'
    end
  end

  def statement_item_icon(statement_item)
    if statement_item.confirmed?
      icon 'hand-thumb-up', options: { class: 'h-5 w-5 text-success-500' }
    elsif statement_item.ignored?
      icon 'hand-thumb-down', options: { class: 'h-5 w-5 text-warning-500' }
    else
      icon 'question-mark-circle', options: { class: 'h-5 w-5 text-gray-500' }
    end
  end
end
