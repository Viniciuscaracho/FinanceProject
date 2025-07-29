class ApplicationService
  include Interactor
  include RailsEventStoreHelper

  protected

  def logger
    Rails.logger
  end

  def add_fail_message(record)
    context.fail!(message: record.errors.full_messages.first) if record.errors.any?
  end
end
