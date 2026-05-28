# frozen_string_literal: true

module WhatsApp
  class TemplateRenderer
    TEMPLATES = {
      appointment_confirmation: "✅ Agendamento confirmado!\n\nOlá, %<patient>s! Sua consulta de *%<service>s* com %<professional>s está marcada para *%<datetime>s*.\n\nPara reagendar ou cancelar: %<manage_url>s",
      appointment_new_booking_professional: "📅 *Novo agendamento recebido!*\n\nPaciente: *%<patient>s*\nServiço: *%<service>s*\nData/hora: *%<datetime>s*\n\nVerifique sua agenda. 🗓️",
      appointment_reminder_24h: "Oi %<patient>s, lembrete: sua consulta com %<professional>s é amanhã às %<time>s. Confirma presença? ✅",
      appointment_reminder_1h:  "Oi %<patient>s! Sua consulta com %<professional>s começa em 1 hora (%<time>s). Até já! 🕐",
      payment_link:             "Olá %<patient>s! Segue o link para pagamento da sua consulta com %<professional>s: %<link>s 💳",
      payment_confirmed:        "Pagamento recebido! ✅ Obrigado, %<patient>s. Até a consulta!",
      meal_plan_updated:        "Oi %<patient>s! %<professional>s atualizou seu plano alimentar. Acesse aqui: %<link>s 🥗",
      form_pending:             "Oi %<patient>s! Antes da sua consulta com %<professional>s, preencha este formulário: %<link>s 📋",
      return_reminder:          "Oi %<patient>s! Faz um tempo desde sua última consulta com %<professional>s. Quer marcar seu retorno? 📅",
      billing_notification:     "📋 *Cobrança Pendente*\n\nOlá, %<patient>s! Seu agendamento de *%<service>s* em %<datetime>s está com pagamento pendente.\n\n💰 Valor: %<price>s\n\nQualquer dúvida, estamos à disposição. 😊",
      pix_reminder:             "💳 *Lembrete de Pagamento*\n\nOlá, %<patient>s! Amanhã você tem *%<service>s* com %<professional>s às %<time>s.\n\n💰 Valor: %<price>s\n🔑 Chave PIX: %<pix_key>s",
      overdue_notification:     "⚠️ *Pagamento em Atraso*\n\nOlá, %<patient>s! O pagamento do seu *%<service>s* em %<datetime>s ainda está em aberto.\n\n💰 Valor: %<price>s\n\nPor favor, regularize o quanto antes. Obrigado! 🙏"
    }.freeze

    def self.render(event_type, resource, contact)
      template = TEMPLATES[event_type.to_sym]
      return "" unless template

      vars = build_vars(event_type.to_sym, resource, contact)
      format(template, vars)
    rescue KeyError
      template
    end

    def self.build_vars(event, resource, contact)
      patient      = contact&.first_name || "Paciente"
      professional = professional_name(resource)

      base = { patient: patient, professional: professional }

      case event
      when :appointment_confirmation
        base.merge(
          datetime:   format_datetime(resource.start_time),
          service:    resource.try(:service)&.name || "Consulta",
          manage_url: manage_url(resource)
        )
      when :appointment_new_booking_professional
        base.merge(
          datetime: format_datetime(resource.start_time),
          service:  resource.try(:service)&.name || "Consulta"
        )
      when :appointment_reminder_24h, :appointment_reminder_1h
        base.merge(time: format_time(resource.start_time))
      when :payment_link
        base.merge(link: payment_link(resource))
      when :meal_plan_updated
        base.merge(link: meal_plan_link(resource))
      when :form_pending
        base.merge(link: form_link(resource))
      when :billing_notification, :overdue_notification
        base.merge(
          service:  resource.try(:service)&.name || "Serviço",
          datetime: format_datetime(resource.start_time),
          price:    price_formatted(resource)
        )
      when :pix_reminder
        base.merge(
          service:  resource.try(:service)&.name || "Serviço",
          time:     format_time(resource.start_time),
          price:    price_formatted(resource),
          pix_key:  pix_key_from_link(resource)
        )
      else
        base
      end
    end

    def self.professional_name(resource)
      return "" unless resource.respond_to?(:account_user)
      resource.account_user&.user&.first_name || "Profissional"
    end

    def self.format_datetime(time)
      time.in_time_zone("America/Sao_Paulo").strftime("%d/%m/%Y às %H:%M")
    end

    def self.format_time(time)
      time.in_time_zone("America/Sao_Paulo").strftime("%H:%M")
    end

    def self.payment_link(resource)
      resource.try(:stripe_payment_link_url).presence || resource.try(:payment_link_url) || ""
    end

    def self.meal_plan_link(resource)
      resource.try(:public_url) || ""
    end

    def self.form_link(resource)
      resource.try(:anamnese_link) || ""
    end

    def self.manage_url(resource)
      resource.try(:manage_url) || ""
    end

    def self.price_formatted(resource)
      cents = resource.try(:price_cents).to_i
      "R$ #{format('%.2f', cents / 100.0).gsub('.', ',')}"
    end

    def self.pix_key_from_link(resource)
      link = resource.try(:appointment_link)
      return "" unless link
      (link.settings&.dig('automations', 'pix_key')).to_s
    end
  end
end
