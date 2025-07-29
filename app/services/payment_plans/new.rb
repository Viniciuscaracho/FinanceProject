# frozen_string_literal: true

module PaymentPlans
  class New
    include Interactor::Organizer

    organize PaymentPlans::BuildNew,
             PaymentPlans::BuildNewInstallments,
             PaymentPlans::FixLastInstallmentAmount,
             PaymentPlans::SumInstallments,
             PaymentPlans::GenerateNumberOfInstallments
  end
end
