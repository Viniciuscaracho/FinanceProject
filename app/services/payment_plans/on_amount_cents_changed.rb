# frozen_string_literal: true

module PaymentPlans
  class OnAmountCentsChanged
    include Interactor::Organizer

    organize PaymentPlans::RefreshInstallmentAmounts,
             PaymentPlans::FixLastInstallmentAmount,
             PaymentPlans::SumInstallments,
             PaymentPlans::GenerateNumberOfInstallments
  end
end
