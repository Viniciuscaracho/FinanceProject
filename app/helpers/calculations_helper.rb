# frozen_string_literal: true

module CalculationsHelper
  def calculate_percentage(float_partial, float_total)
    CalculationsHelper.calculate_percentage(float_partial.to_f, float_total.to_f)
  end

  def calculate_due_date(due_date:, frequency:, number:)
    CalculationsHelper.calculate_due_date(due_date: due_date, frequency: frequency, number: number)
  end

  def self.calculate_amount_cents(amount_cents:, number_of_installments:)
    amount_cents / number_of_installments
  end

  def self.calculate_percentage(float_partial, float_total)

    return 100.0 if (float_partial == float_total) ||  float_total.zero?

    return 0.0 if float_partial.zero?

    (float_partial / float_total) * 100.to_f
  end

  def self.calculate_due_date(due_date:, frequency:, number:)
    case frequency
    when :daily
      due_date + number.days
    when :weekly
      due_date + number.weeks
    when :biweekly
      due_date + (2 * number.weeks)
    when :monthly
      due_date + number.months
    when :bimonthly
      due_date + (2 * number.months)
    when :quarterly
      due_date + (3 * number.months)
    when :semiannual
      due_date + (6 * number.months)
    else
      due_date + number.years
    end
  end
end
