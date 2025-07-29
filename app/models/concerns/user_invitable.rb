# frozen_string_literal: true

module UserInvitable
  extend ActiveSupport::Concern

  included do
    # invite token
    attribute :invite

    # Invitation callbacks
    before_validation :set_account_by_invitation, on: %i[create], if: :invite?
    after_create :accept_invite_after_create, if: :invite?
  end

  def invite?
    invite.present?
  end

  private

  def set_account_by_invitation
    return if account.present?

    @account_invitation = AccountInvitation.find_by(token: invite)
    self.account = @account_invitation.account
  end

  def accept_invite_after_create
    return if @account_invitation.blank?

    @account_invitation.accept!(self)
  end
end
