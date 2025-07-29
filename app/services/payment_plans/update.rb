module PaymentPlans
  class Update < ApplicationService
    def call
      if context.payment_plan.save
        context.message = I18n.t('payment_plans.update.success')
      else
        context.fail!(message: context.payment_plan.errors.full_messages.first)
      end
    end
  end
end