# frozen_string_literal: true

module PaymentPlans
  class OnRemoveInstallmentCalled
    include Interactor::Organizer

    organize PaymentPlans::RefreshInstallmentNumbers,
             PaymentPlans::RefreshInstallmentAmounts,
             PaymentPlans::FixLastInstallmentAmount,
             PaymentPlans::SumInstallments,
             PaymentPlans::GenerateNumberOfInstallments
  end
end
