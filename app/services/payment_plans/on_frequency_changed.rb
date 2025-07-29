# frozen_string_literal: true

module PaymentPlans
  class OnFrequencyChanged
    include Interactor::Organizer

    organize PaymentPlans::RefreshInstallmentDueDates,
             PaymentPlans::GenerateNumberOfInstallments,
             PaymentPlans::SumInstallments
  end
end
