# frozen_string_literal: true

module PaymentPlans
  class Edit
    include Interactor::Organizer

    organize PaymentPlans::SumInstallments,
             PaymentPlans::GenerateNumberOfInstallments
  end
end
