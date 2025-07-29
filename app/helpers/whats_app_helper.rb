# frozen_string_literal: true

module WhatsAppHelper
  def create_whatsapp_link(message:, phone: nil)
    if phone
      "https://#{link_ref}.whatsapp.com/send?phone=#{phone}&text=#{ERB::Util.u(message)}"
    else
      "https://#{link_ref}.whatsapp.com/send?text=#{ERB::Util.u(message)}"
    end
  end

  def link_ref
    mobile_request? ? 'api' : 'web'
  end
end
