# Preview all emails at http://localhost:3000/rails/mailers/account_invitations_mailer
class AccountInvitationsMailerPreview < ActionMailer::Preview

  # Preview this email at http://localhost:3000/rails/mailers/account_invitations_mailer/invite
  def invite
    AccountInvitationsMailer.invite
  end

end
