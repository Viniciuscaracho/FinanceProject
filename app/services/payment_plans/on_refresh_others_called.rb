# frozen_string_literal: true

module PaymentPlans
  class OnRefreshOthersCalled
    include Interactor::Organizer

    organize PaymentPlans::RefreshOthersInstallmentAmounts,
             PaymentPlans::FixLastInstallmentAmount,
             PaymentPlans::SumInstallments,
             PaymentPlans::GenerateNumberOfInstallments
  end
end
