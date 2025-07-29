# frozen_string_literal: true

# == Schema Information
#
# Table name: account_users
#
#  id         :bigint           not null, primary key
#  policies   :jsonb            not null
#  role_cd    :integer          default(0), not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  account_id :bigint           not null
#  user_id    :bigint           not null
#
# Indexes
#
#  index_account_users_on_account_id              (account_id)
#  index_account_users_on_account_id_and_user_id  (account_id,user_id) UNIQUE
#  index_account_users_on_role_cd                 (role_cd)
#  index_account_users_on_user_id                 (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (user_id => users.id)
#
class AccountUser < ApplicationRecord
  include AccountUsers::Searchable

  audited associated_with: :account

  ROLES = {
    admin: 0,
    custom: 1
  }.freeze

  DEFAULT_POLICIES = %w[
    transactions.revenues.read
    transactions.revenues.create
    transactions.revenues.update
    transactions.revenues.destroy

    transactions.fixed_expenses.read
    transactions.fixed_expenses.create
    transactions.fixed_expenses.update
    transactions.fixed_expenses.destroy

    transactions.variable_expenses.read
    transactions.variable_expenses.create
    transactions.variable_expenses.update
    transactions.variable_expenses.destroy

    transactions.payrolls.read
    transactions.payrolls.create
    transactions.payrolls.update
    transactions.payrolls.destroy

    transactions.taxes.read
    transactions.taxes.create
    transactions.taxes.update
    transactions.taxes.destroy

    transactions.transfers.read
    transactions.transfers.create
    transactions.transfers.update
    transactions.transfers.destroy

    bank_accounts.read
    bank_accounts.create
    bank_accounts.update

    contacts.read
    contacts.create
    contacts.update
    contacts.destroy

    categories.read
    categories.create
    categories.update
    categories.destroy

    cost_centers.read
    cost_centers.create
    cost_centers.update
    cost_centers.destroy

    imports.read
    imports.create

    reports.read
    home.read

    advanced_search.read

    invoices.read
    invoices.create
    invoices.update
    invoices.destroy
  ].freeze

  scope :admin,      -> { where(role_cd: ROLES[:admin]) }
  scope :custom,     -> { where(role_cd: ROLES[:custom]) }
  scope :confirmeds, -> { where_assoc_exists(:user, 'users.confirmed_at IS NOT NULL') }

  as_enum :role, ROLES

  validates :user_id, uniqueness: { scope: :account_id }

  belongs_to :account, counter_cache: true
  belongs_to :user
  has_many :notifications, as: :recipient, dependent: :delete_all

  after_destroy :change_to_personal_account
  after_destroy_commit :remove_or_keep_free_access

  before_validation :set_default_role
  before_save :set_default_policies

  def others
    account.account_users.where.not(id:)
  end

  def owner?
    account.owner_id == user_id
  end

  def name
    "#{account&.name} - #{user&.name}"
  end

  private

  def set_default_role
    return if role.present?

    self.role = default_role
  end

  def exists_any_account_user?
    account.account_users.where(role_cd: ROLES[:admin]).exists?
  end

  def default_role
    return :custom if exists_any_account_user?

    :admin
  end

  def change_to_personal_account
    if user.accounts.count.zero?
      user.disable
    elsif user.my_personal_account.present?
      user.change_to_personal_account
    else
      user.update(account: user.accounts.first)
    end
  end

  def remove_or_keep_free_access
    return if user.exists_business_account?

    user.remove_or_keep_free_access
  end

  def set_default_policies
    # Não limpar políticas de admins que já têm políticas
    return if admin? && policies.any?

    # Definir políticas padrão para custom ou admin sem políticas
    self.policies = DEFAULT_POLICIES if (custom? || admin?) && policies.empty?
  end
end
