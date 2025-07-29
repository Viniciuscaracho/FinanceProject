module AccountInvitations
  class Accept < ApplicationService
    def call
      account_user = context.account_invitation.accept!(context.user)
      if account_user.present?
        context.account_user = account_user
      else
        context.fail!(message: context.account_invitation.errors.full_messages.first)
      end
    end
  end
end
