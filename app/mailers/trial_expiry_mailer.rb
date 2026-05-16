# frozen_string_literal: true

class TrialExpiryMailer < ApplicationMailer
  def expiry_reminder(account, days_remaining)
    @account = account
    @days_remaining = days_remaining
    @company_name = account.company&.name || account.name || 'sua conta'
    @owner_name = account.owner&.name || 'Olá'

    recipient = account.email.presence || account.owner&.email
    return unless recipient.present?

    mail(
      to: recipient,
      subject: subject_for(days_remaining)
    )
  end

  private

  def subject_for(days)
    case days
    when 1 then 'Seu período de teste encerra amanhã — garanta o acesso agora'
    when 3 then 'Seu período de teste encerra em 3 dias'
    else        "Seu período de teste encerra em #{days} dias"
    end
  end
end
