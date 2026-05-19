# frozen_string_literal: true

module WhatsApp
  class EventHandler
    def self.call(account:, contact:, event:, resource: nil)
      return unless contact&.cell_phone_number.present?

      config = account.whatsapp_config
      return unless config&.enabled?
      return unless config.automation_enabled?(event)
      return unless StateValidator.valid?(event, resource)

      key = idempotency_key(account, contact, event, resource)
      return if WhatsappMessage.exists?(idempotency_key: key)

      body       = TemplateRenderer.render(event, resource, contact)
      send_at    = Scheduler.next_slot(account, contact)
      channel    = config.configured? ? 'bot' : 'bot'

      message = WhatsappMessage.create!(
        account:         account,
        contact:         contact,
        event_type:      event.to_s,
        channel:         channel,
        status:          'pending',
        idempotency_key: key,
        body:            body,
        scheduled_for:   send_at,
        reference:       resource
      )

      WhatsApp::SenderJob.set(wait_until: send_at).perform_later(message.id)

      message
    rescue ActiveRecord::RecordNotUnique
      # race condition: outra thread criou com a mesma idempotency_key
      nil
    end

    def self.idempotency_key(account, contact, event, resource)
      resource_part = resource ? "#{resource.class.name}-#{resource.id}" : "nil"
      "#{account.id}-#{contact.id}-#{event}-#{resource_part}"
    end
  end
end
