# frozen_string_literal: true

module HomeHelper
  def time_greeting
    hour = Time.current.hour
    if hour >= 5 && hour < 12
      'manhã'
    elsif hour >= 12 && hour < 18
      'tarde'
    else
      'noite'
    end
  end

  def format_currency(amount)
    number_to_currency(amount, unit: 'R$ ', separator: ',', delimiter: '.')
  end

  def format_percentage(value)
    number_to_percentage(value, precision: 1)
  end

  def transaction_status_class(amount)
    amount >= 0 ? 'text-green-600' : 'text-red-600'
  end

  def transaction_icon(amount)
    amount >= 0 ? 'trending-up' : 'trending-down'
  end

  def transaction_indicator_class(amount)
    amount >= 0 ? 'bg-green-500' : 'bg-red-500'
  end
end
