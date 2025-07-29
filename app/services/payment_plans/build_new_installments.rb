# frozen_string_literal: true

module PaymentPlans
  class BuildNewInstallments < ApplicationService
    def call
      3.times { |number| add_new_installment(number:) }
    end

    private

    def add_new_installment(number:)
      attributes = context.transaction.dup.tap { |installment| populate_installment(installment:, number:) }.attributes
      context.payment_plan.transactions.build(attributes)
    end

    def populate_installment(installment:, number:)
      installment.payment_type = :installment
      installment.installment_number = number + 1
      installment.installment_total = context.payment_plan.number_of_installments
      installment.installment_type = context.payment_plan.frequency
      installment.due_date = calculate_due_date(due_date: context.transaction.due_date,
                                                frequency: context.payment_plan.frequency, number:)
      installment.amount_cents = build_amount_cents
      installment.competency_date = number.zero? ? context.transaction.competency_date : nil
      installment.document_number = context.transaction.document_number
      installment.paid = number.zero? ? context.transaction.paid : false
      installment.paid_at = number.zero? ? context.transaction.paid_at : nil
      installment.tag_list = context.transaction.tag_list
    end

    def calculate_due_date(due_date:, frequency:, number:)
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

    def build_amount_cents
      context.payment_plan.total_amount? ? context.payment_plan.amount_cents / context.payment_plan.number_of_installments : context.payment_plan.amount_cents
    end
  end
end
