# frozen_string_literal: true

module PaymentPlans
  class OnNumberOfInstallmentsChanged
    include Interactor::Organizer

    organize PaymentPlans::RefreshInstallmentNumbers,
             PaymentPlans::RefreshInstallmentDueDates,
             PaymentPlans::RefreshInstallmentAmounts,
             # PaymentPlans::FixLastInstallmentAmount,
             PaymentPlans::SumInstallments,
             PaymentPlans::GenerateNumberOfInstallments
  end
end
