module AccountInvitations
  class Create < ApplicationService
    def call
      context.account_invitation = context.account.account_invitations.new(context.account_invitation_params.merge(invited_by: context.invited_by))
      if context.account_invitation.save
        AccountInvitationsMailer.with(account_invitation: context.account_invitation).invite.deliver_later
      else
        context.fail!(message: context.account_invitation.errors.full_messages.first)
      end
    end
  end
end
