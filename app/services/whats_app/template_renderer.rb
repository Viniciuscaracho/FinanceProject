# frozen_string_literal: true

module WhatsApp
  class TemplateRenderer
    TEMPLATES = {
      appointment_confirmation: "✅ Agendamento confirmado!\n\nOlá, %<patient>s! Sua consulta de *%<service>s* com %<professional>s está marcada para *%<datetime>s*.\n\nPara reagendar ou cancelar: %<manage_url>s",
      appointment_reminder_24h: "Oi %<patient>s, lembrete: sua consulta com %<professional>s é amanhã às %<time>s. Confirma presença? ✅",
      appointment_reminder_1h:  "Oi %<patient>s! Sua consulta com %<professional>s começa em 1 hora (%<time>s). Até já! 🕐",
      payment_link:             "Olá %<patient>s! Segue o link para pagamento da sua consulta com %<professional>s: %<link>s 💳",
      payment_confirmed:        "Pagamento recebido! ✅ Obrigado, %<patient>s. Até a consulta!",
      meal_plan_updated:        "Oi %<patient>s! %<professional>s atualizou seu plano alimentar. Acesse aqui: %<link>s 🥗",
      form_pending:             "Oi %<patient>s! Antes da sua consulta com %<professional>s, preencha este formulário: %<link>s 📋",
      return_reminder:          "Oi %<patient>s! Faz um tempo desde sua última consulta com %<professional>s. Quer marcar seu retorno? 📅"
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
      when :appointment_reminder_24h, :appointment_reminder_1h
        base.merge(time: format_time(resource.start_time))
      when :payment_link
        base.merge(link: payment_link(resource))
      when :meal_plan_updated
        base.merge(link: meal_plan_link(resource))
      when :form_pending
        base.merge(link: form_link(resource))
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
      resource.try(:payment_link_url) || ""
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
  end
end
