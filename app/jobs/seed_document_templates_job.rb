
class SeedDocumentTemplatesJob < ApplicationJob
  queue_as :default

  def perform(account)
    ApplicationRecord.transaction { ReceiptTemplate.create_default_templates(account) }
    ApplicationRecord.transaction { ContractTemplate.create_default_templates(account) }
    ApplicationRecord.transaction { ProfessionalDocumentTemplate.create_default_templates(account) }
  end

end