class ExecuteImportJob < ApplicationJob
  queue_as :imports

  def perform(import_id)
    import = Import.find(import_id)

    case import.source
    when :zero_paper
      Imports::ZeroPaper.call(import:, account: import.account)
    when :xlsx_contacts
      Imports::XlsxContacts.call(import:, account: import.account)
    when :xlsx_default
      Imports::XlsxDefault.call(import:, account: import.account)
    else
      Rails.logger.warn('>>>>>>>>>>>>>>>>>>>>>')
      Rails.logger.warn('  Source not found   ')
      Rails.logger.warn('>>>>>>>>>>>>>>>>>>>>>')
    end
  rescue StandardError => e
    Rails.logger.error(e)
  end
end
