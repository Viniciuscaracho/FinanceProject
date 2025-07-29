# frozen_string_literal: true

class DailyNotificationEmailWorker
  include Sidekiq::Worker

  sidekiq_options retry: false

  def perform
    account_users = AccountUser.includes(
      :user, account: :company
    )

    # Filtra somentes os usuários que tem permissão para receber emails de notificação
    account_users = account_users.where(
      '((policies ? :value) OR (role_cd = :admin))', value: 'notifications.email.read', admin: 0
    )

    # Filtra somente as contas que tem transações que vencem hoje
    account_users = account_users.where_assoc_exists(
      %i[account transactions],
      [
        'transactions.due_date = ? AND transactions.paid = ?',
        Date.current,
        false
      ]
    )

    # Filtra somente os usuários que tem a preferência de receber e-mail
    account_users = account_users.where_assoc_exists(:user, { preference_receive_email: true })

    # Envia e-mail para os usuários
    account_users.find_each(batch_size: 100) { |account_user| send_notification(account_user) }
  rescue StandardError => e
    Rails.logger.error(e)
  end

  private

  def send_notification(account_user)
    return if account_user.account.disabled?

    DailyNotificationMailer.send_daily_notification(account_user:).deliver_now
  end
end
