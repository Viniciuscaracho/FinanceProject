# frozen_string_literal: true

module PaymentPlans
  class OnInstallmentAmountCentsChanged
    include Interactor::Organizer

    organize PaymentPlans::SumInstallments, PaymentPlans::GenerateNumberOfInstallments
  end
end
