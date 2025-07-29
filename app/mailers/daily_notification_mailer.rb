class DailyNotificationMailer < ApplicationMailer
  layout false

  def send_daily_notification(account_user:)
    account = account_user.account
    user = account_user.user

    I18n.locale = user.preferred_language

    @company_name = account.company.name
    @person_name = user.name || user.email

    bank_accounts = account.bank_accounts.kept
    transactions = account.transactions.only_simple_and_children.where(due_date: Date.current, paid: false, bank_account: bank_accounts)
    return if transactions.count.zero?

    @revenues = transactions.revenues
    @revenues_total = @revenues.sum(:exchanged_amount_cents)

    @expenses = transactions.expenses
    @expenses_total = @expenses.sum(:exchanged_amount_cents)

    @number_of_expirations = @revenues.or(@expenses).count

    mail(
      to: ensure_email_with_name(user.email, user.name),
      subject: t('daily_notification_mailer.send_daily_notification.title', company: @company_name)
    )
  end

  private

  def ensure_email_with_name(email, name)
    return email if name.blank?

    email_address_with_name(email, name)
  end
end
