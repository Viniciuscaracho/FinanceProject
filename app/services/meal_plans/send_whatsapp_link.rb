# frozen_string_literal: true

module MealPlans
  class SendWhatsappLink < ApplicationService
    def call
      plan    = context.meal_plan
      account = plan.account
      contact = plan.contact

      return context.fail!(error: 'Plano sem contato associado') unless contact
      phone = (contact.cell_phone_number.presence || contact.phone_number.presence)
      return context.fail!(error: 'Contato sem número de telefone') unless phone.present?

      message = build_message(plan, contact, account)
      result  = WhatsApp::EvolutionApiClient.send_message(account: account, phone: phone, message: message)

      if result[:success]
        context.sent = true
      else
        context.sent  = false
        context.error = result[:error]
        Rails.logger.warn "[MealPlan WhatsApp] Falha ao enviar link para contato ##{contact.id}: #{result[:error]}"
      end
    end

    private

    def build_message(plan, contact, account)
      professional_name = account.company&.name || account.users.first&.full_name || 'seu nutricionista'
      patient_name      = contact.first_name.presence || contact.name

      msg  = "🥗 *Seu Plano Alimentar está pronto, #{patient_name}!*\n\n"
      msg += "#{professional_name} preparou um plano personalizado para você.\n\n"
      msg += "Acesse aqui:\n#{plan.public_url}\n\n"
      msg += "Neste link você encontra todas as refeições, porções e nutrientes do seu plano.\n\n"
      msg += "_Qualquer dúvida, entre em contato!_ 💪"
      msg
    end
  end
end
