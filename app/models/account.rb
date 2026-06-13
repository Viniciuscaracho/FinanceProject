# frozen_string_literal: true

# == Schema Information
#
# Table name: accounts
#
#  id                                                   :bigint           not null, primary key
#  account_invitations_count                            :integer
#  account_type_cd                                      :integer          default(0), not null
#  account_users_count                                  :integer
#  admin                                                :boolean          default(FALSE), not null
#  balance_cents                                        :bigint           default(0), not null
#  balance_currency                                     :string(3)        default("BRL"), not null
#  bank_accounts_count                                  :integer
#  categories_count                                     :integer
#  contacts_count                                       :integer
#  cost_centers_count                                   :integer
#  country_code                                         :string(2)        default("BR")
#  current_period_ends_at                               :datetime
#  current_period_starts_at                             :datetime
#  default_currency                                     :string(3)        default("BRL")
#  directory_description                                :text
#  directory_visible                                    :boolean          default(FALSE), not null
#  discarded_at                                         :datetime
#  free                                                 :boolean          default(FALSE), not null
#  google_access_token                                  :string
#  google_calendar_connected                            :boolean          default(FALSE), not null
#  google_contacts_access_token                         :string
#  google_contacts_connected                            :boolean          default(FALSE), not null
#  google_contacts_refresh_token                        :string
#  google_contacts_token_expires_at                     :datetime
#  google_refresh_token                                 :string
#  google_token_expires_at                              :datetime
#  instagram_url                                        :string
#  max_active_users                                     :integer          default(3), not null
#  max_storage_size_in_bytes                            :bigint           default(5368709120), not null
#  pix_key                                              :string
#  preferences                                          :jsonb            not null
#  processor_plan_name                                  :string
#  profession_category                                  :string
#  professional_registration                            :string
#  profile_views                                        :integer          default(0), not null
#  relation_type_cd(Relation type)                      :integer
#  specialties                                          :string           default([]), is an Array
#  subscription_status                                  :string           default("incomplete")
#  suspended                                            :boolean          default(FALSE), not null
#  transactions_count                                   :integer
#  trial                                                :boolean          default(FALSE), not null
#  trial_ends_at                                        :date
#  created_at                                           :datetime         not null
#  updated_at                                           :datetime         not null
#  abacate_pay_customer_id                              :string
#  company_id                                           :bigint           not null
#  google_calendar_id                                   :string           default("primary")
#  owner_id                                             :bigint
#  processor_customer_id                                :string
#  processor_plan_id                                    :string
#  referral_code_id(Referral code used by the referrer) :bigint
#  related_to_id(Related to account)                    :bigint
#  subscription_id                                      :bigint
#
# Indexes
#
#  index_accounts_on_company_id           (company_id)
#  index_accounts_on_directory_visible    (directory_visible)
#  index_accounts_on_discarded_at         (discarded_at)
#  index_accounts_on_owner_id             (owner_id)
#  index_accounts_on_profession_category  (profession_category)
#  index_accounts_on_referral_code_id     (referral_code_id)
#  index_accounts_on_related_to_id        (related_to_id)
#  index_accounts_on_subscription_id      (subscription_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => people.id)
#  fk_rails_...  (owner_id => users.id)
#  fk_rails_...  (referral_code_id => referral_codes.id)
#  fk_rails_...  (related_to_id => accounts.id)
#  fk_rails_...  (subscription_id => subscriptions.id)
#
class Account < ApplicationRecord
  # include Flipper::Identifier

  ACCOUNT_TYPES = {
    business: 0,
    personal: 1
    # familiar: 2
  }.freeze

  RELATION_TYPES = {
    partner: 0,
    reseller: 1,
    representative: 2,
    referred: 3
  }.freeze

  as_enum :account_type, ACCOUNT_TYPES
  as_enum :relation_type, RELATION_TYPES

  audited associated_with: :company
  has_prefix_id :acct, override_find: false, override_param: false

  monetize :balance_cents

  include Accounts::Setup
  include Accounts::Searchable
  include Accounts::BalanceControl
  include Accounts::SubscriptionControl
  include Accounts::Preferences
  include Accounts::Pluggy
  include Accounts::FeatureFlag
  include Accounts::GoogleCalendar
  include Discardable
  include Referrer

  # store_attribute :settings, :default_currency, :string, default: 'BRL'

  delegate :name, :first_name, :last_name, :email, :phone_number, to: :company

  scope :personal,                   -> { where(account_type_cd: 1) }
  scope :business,                   -> { where(account_type_cd: 0) }

  # BelongsTo Associations
  belongs_to :owner,   class_name: 'User'
  belongs_to :company, dependent: :destroy
  belongs_to :referral_code, optional: true
  belongs_to :related_to, class_name: 'Account', optional: true

  # HasMany Associations
  has_associated_audits # account.associated_audits
  has_many :account_invitations, dependent: :delete_all
  has_many :account_users,       dependent: :delete_all
  has_many :users,               through:   :account_users
  has_many :contacts,            dependent: :delete_all
  has_many :bank_accounts,       dependent: :delete_all
  has_many :categories,          dependent: :delete_all
  has_many :cost_centers,        dependent: :delete_all
  has_many :transactions,        dependent: :delete_all
  has_many :appointments,        dependent: :delete_all
  has_many :appointment_links,   dependent: :delete_all
  has_many :appointment_notes,   dependent: :delete_all
  has_many :anamnese_templates,  dependent: :delete_all
  has_many :anamnese_responses,  dependent: :delete_all
  has_many :patient_goals,       dependent: :delete_all
  has_many :patient_documents,   dependent: :delete_all
  has_many :meal_plans,          dependent: :destroy
  has_many :foods,               dependent: :destroy, foreign_key: :account_id
  has_many :imports,             dependent: :delete_all
  has_many :exports,             dependent: :delete_all
  has_many :document_templates,  dependent: :delete_all
  has_many :receipt_templates,   dependent: :delete_all
  has_many :invoice_templates,   dependent: :delete_all
  has_many :contract_templates,  dependent: :delete_all
  has_many :professional_document_templates, dependent: :delete_all
  has_many :companies,           dependent: :delete_all
  has_many :payment_plans,       dependent: :delete_all
  has_many :connected_users,     class_name: 'User', inverse_of: :account, dependent: :nullify
  has_many :statements,          dependent: :delete_all
  has_many :statement_items,     through: :statements
  has_many :api_tokens,          dependent: :delete_all
  has_many :related_accounts,    class_name: 'Account', foreign_key: :related_to_id, inverse_of: :related_to,
                                 dependent: :nullify
  has_many :services,            class_name: 'Service', inverse_of: :account, dependent: :destroy
  has_many :invoices,            class_name: 'Invoice', inverse_of: :account, dependent: :destroy
  has_one :webhook,              class_name: 'Webhook', inverse_of: :account, dependent: :destroy
  has_one  :whatsapp_config,    dependent: :destroy
  has_many :whatsapp_messages,  dependent: :destroy

  # integrations
  has_many :integration_stores, dependent: :delete_all
  has_many :relationship_stores, dependent: :delete_all
  has_many :attachments, class_name: 'ActiveStorage::Attachment', inverse_of: :account, dependent: :destroy

  has_one_attached :exported_file

  accepts_nested_attributes_for :company
  accepts_nested_attributes_for :webhook

  validates :account_type, :default_currency, presence: true
  validates :relation_type_cd, presence: true, if: :related_to_id?

  before_destroy do
    ApplicationRecord.transaction { connected_users.each(&:change_to_personal_account) }
  end

  after_create_commit do
    SeedDocumentTemplatesJob.perform_later(self)
    SeedMealPlanTemplatesJob.perform_later(self)
  end

  after_update_commit :reload_frames_after_commit

  has_settings do |s|
    s.key :print_settings,
          defaults: { show_header: true, show_logo: true, show_title: true, show_created_by: true,
                      show_bank_account: true, show_cost_centers: true, show_categories: true,
                      show_payment_methods: true, show_tags: true, show_period: true, show_graph: true }
  end

  def reload_frames_after_commit
    return unless balance_cents_previously_changed?

    broadcast_action_to self, :switch_account,
                        action: :turbo_frame_reload,
                        target: :switch_account,
                        html: '', locals: {}
  end

  def referrer?
    referral_codes.exists?
  end

  def referee?
    referral_code_id.present?
  end

  def just_referee?
    referee? && !referrer?
  end

  def reindex_after_import!
    Transaction.reindex_by(:account_id, id)
    Contact.reindex_by(:account_id, id)
    Category.reindex_by(:account_id, id)
    CostCenter.reindex_by(:account_id, id)
  end

  # Public class methods
  def self.orbi_account
    find_by(admin: true)
  end

  # Public instance methods
  def default_bank_account
    bank_account = bank_accounts.find_by(default: true) || bank_accounts.first
    return bank_account if bank_account.present?

    BankAccount.transaction do
      ActiveRecord::Base.connected_to(role: ActiveRecord.writing_role) do
        bank_account = bank_accounts.create!(name: I18n.t('bank_accounts.default_name'), account_type: :current_account, default: true)
      end
    end

    bank_account
  end

  def orbi?
    admin == true
  end

  def consumed_storage_size_in_bytes
    # 1.gigabyte # TODO: Implement this
    attachments.joins(:blob).sum(:byte_size)
    # transactions.joins(attachments_attachments: :blob).sum(:byte_size)
  end

  def available_storage_in_bytes
    max_storage_size_in_bytes - consumed_storage_size_in_bytes
  end

  def available_storage_in_percentage
    return 0.to_f if consumed_storage_size_in_bytes.zero? || max_storage_size_in_bytes.zero?

    (consumed_storage_size_in_bytes.to_f / max_storage_size_in_bytes) * 100
  end

  def can_add_user?
    consumed_active_users < max_active_users.to_i
  end

  def consumed_active_users
    account_users_count.to_i + account_invitations_count.to_i
  end

  def cannot_add_user?
    !can_add_user?
  end

  def reset
    Account.transaction do
      statement_items.with_discarded.delete_all
      statements.with_discarded.delete_all
      transactions.where.not(parent_id: nil).update_all(parent_id: nil)
      transactions.delete_all
      payment_plans.with_discarded.delete_all
      invoices.destroy_all
      categories.with_discarded.delete_all
      cost_centers.with_discarded.delete_all
      contacts.with_discarded.destroy_all
      imports.with_discarded.destroy_all
      associated_audits.delete_all
      ActsAsTaggableOn::Tagging.by_tenant(Current.account).destroy_all
      bank_accounts.where(default: false).delete_all
      bank_accounts.default.update(initial_balance_cents: 0)
      BankAccounts::UpdateBalance.call(bank_account_id: bank_accounts.default.id)
    end

    reset_cache_counters
  end

  def delete_account
    ActiveRecord::Base.transaction do
      reset
      destroy
    end
  end

  def reset_cache_counters
    Account.reset_counters(id, :account_users, :account_invitations, :bank_accounts, :contacts, :categories,
                           :cost_centers, :transactions)
  end

  def current_account?
    Current.account == self
  end

  def set_default_bank_account_by_greater_balance
    bank_account = bank_accounts.order(balance_cents: :desc).first
    return if bank_account.blank?

    bank_account.update(default: true)
  end
end
