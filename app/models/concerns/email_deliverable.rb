# frozen_string_literal: true

module EmailDeliverable
  extend ActiveSupport::Concern

  included do
    validate :verify_email_address, on: %i[create update], if: :email_changed?
  end

  def verify_email_address
    return errors.add(:email, :email_is_dummy) if EmailVerificationHelper.email_is_dummy?(email:)

    errors.add(:email, :email_is_not_verified) unless EmailVerificationHelper.email_is_deliverable?(email:)
  end
end
