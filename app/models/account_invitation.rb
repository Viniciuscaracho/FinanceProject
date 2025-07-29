# frozen_string_literal: true

# == Schema Information
#
# Table name: account_invitations
#
#  id            :bigint           not null, primary key
#  email         :string           not null
#  name          :string
#  role_cd       :integer          default(0), not null
#  token         :string           not null
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  account_id    :bigint           not null
#  invited_by_id :bigint           not null
#
# Indexes
#
#  index_account_invitations_on_account_id     (account_id)
#  index_account_invitations_on_invited_by_id  (invited_by_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (invited_by_id => users.id)
#
class AccountInvitation < ApplicationRecord
  include AccountInvitations::Searchable
  include EmailDeliverable

  audited associated_with: :account
  has_secure_token
  as_enum :role, AccountUser::ROLES

  belongs_to :account, counter_cache: true
  belongs_to :invited_by, class_name: 'User'

  validates :name, presence: true, length: { minimum: 3, maximum: 200 }
  validates :email, presence: true, format: { with: /\A([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})\z/i }

  def accept!(user)
    account_user = account.account_users.new(user:, role:)
    if account_user.valid?
      account_user.policies = AccountUser::DEFAULT_POLICIES if account_user.custom?
      ApplicationRecord.transaction do
        account_user.save!
        destroy!
      end

      # [account.owner, invited_by].uniq.each do |recipient|
      #   AcceptedInvite.with(account:, user:).deliver_later(recipient)
      # end

      account_user
    else
      errors.add(:base, account_user.errors.full_messages.first)
      nil
    end
  end

  def reject!
    destroy
  end

  def to_param
    token
  end

  def first_name
    return '' if name.blank?

    name.split.first
  end

  def last_name
    return '' if first_name.blank?

    name.gsub(first_name, '').strip
  end
end
