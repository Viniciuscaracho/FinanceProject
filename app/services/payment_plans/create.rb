# frozen_string_literal: true

module PaymentPlans
  class Create < ApplicationService
    def call
      if context.payment_plan.save
        context.message = I18n.t('payment_plans.create.success')
      else
        context.fail!(message: context.payment_plan.errors.full_messages.first)
      end
    end
  end
end
