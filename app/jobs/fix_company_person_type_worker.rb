# frozen_string_literal: true

class FixCompanyPersonTypeWorker
  include Sidekiq::Worker

  sidekiq_options retry: false

  def perform
    Account.includes(:company).find_each(batch_size: 100) do |account|
      next if account.business? && account.company.legal?
      next if account.personal? && account.company.natural?

      person_type_cd = account.business? ? Person::PERSON_TYPES[:legal] : Person::PERSON_TYPES[:natural]
      account.company.update_columns(person_type_cd:)
    end
  end
end
