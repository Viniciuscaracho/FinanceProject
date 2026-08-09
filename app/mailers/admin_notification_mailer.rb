# frozen_string_literal: true

class AdminNotificationMailer < ApplicationMailer
  ADMIN_EMAIL = ENV.fetch('ADMIN_NOTIFICATION_EMAIL', 'viniciuscaracho77@gmail.com').freeze

  def new_user_signup(user)
    @user  = user
    @email = user.email
    @name  = user.name.presence || user.email
    @provider = user.provider.presence || 'email/senha'
    @signup_at = user.created_at.in_time_zone('America/Sao_Paulo').strftime('%d/%m/%Y às %H:%M')

    mail(
      to:      ADMIN_EMAIL,
      subject: "[Orbi] Novo cadastro: #{@email}"
    )
  end
end
