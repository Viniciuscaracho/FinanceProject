# frozen_string_literal: true

# == Schema Information
#
# Table name: users
#
#  id                                                                       :bigint           not null, primary key
#  accepted_privacy_at                                                      :datetime
#  accepted_terms_at                                                        :datetime
#  admin                                                                    :boolean          default(FALSE), not null
#  api_token                                                                :string
#  collapsed_menu                                                           :boolean          default(FALSE)
#  confirmation_sent_at                                                     :datetime
#  confirmation_token                                                       :string
#  confirmed_at                                                             :datetime
#  contact_me_by                                                            :string
#  current_sign_in_at                                                       :datetime
#  current_sign_in_ip                                                       :string
#  email                                                                    :string           default(""), not null
#  encrypted_password                                                       :string           default(""), not null
#  first_name                                                               :string
#  invitation_accepted_at                                                   :datetime
#  invitation_created_at                                                    :datetime
#  invitation_limit                                                         :integer
#  invitation_sent_at                                                       :datetime
#  invitation_token                                                         :string
#  invited_by_type                                                          :string
#  last_announcement_read_at(Date of last read announcement)                :datetime         default(Thu, 04 Dec 2025 16:58:50.580944000 UTC +00:00), not null
#  last_name                                                                :string
#  last_sign_in_at                                                          :datetime
#  last_sign_in_ip                                                          :string
#  lead_code                                                                :bigint
#  onboarding_created_at                                                    :datetime
#  phone_number                                                             :string
#  postcode                                                                 :string
#  preference_all_bank_accounts                                             :boolean          default(FALSE)
#  preference_beta_tester                                                   :boolean          default(FALSE), not null
#  preference_change_date                                                   :boolean          default(FALSE)
#  preference_disable_view_recurrence                                       :boolean          default(FALSE), not null
#  preference_receive_email                                                 :boolean          default(TRUE)
#  preference_static_totalizer                                              :boolean          default(FALSE)
#  preferred_language                                                       :string
#  provider                                                                 :string
#  remember_created_at                                                      :datetime
#  reset_password_sent_at                                                   :datetime
#  reset_password_token                                                     :string
#  show_initial_tour                                                        :boolean
#  sign_in_count                                                            :integer          default(0), not null
#  time_zone                                                                :string
#  uid                                                                      :string
#  visible_amount(Whether the user can see the amount of the referral code) :boolean          default(TRUE), not null
#  whatsapp_number                                                          :string
#  zp_user                                                                  :boolean
#  created_at                                                               :datetime         not null
#  updated_at                                                               :datetime         not null
#  account_id                                                               :bigint
#  invited_by_id                                                            :bigint
#
# Indexes
#
#  index_users_on_account_id            (account_id)
#  index_users_on_confirmation_token    (confirmation_token) UNIQUE
#  index_users_on_email                 (email) UNIQUE
#  index_users_on_invitation_token      (invitation_token) UNIQUE
#  index_users_on_provider_and_uid      (provider,uid) UNIQUE
#  index_users_on_reset_password_token  (reset_password_token) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
class User < ApplicationRecord
  include Users::Permissions
  include Users::Searchable
  include UserAgreements
  include UserInvitable
  include EmailDeliverable

  acts_as_tagger
  has_person_name

  devise :confirmable, :database_authenticatable, :registerable, :recoverable, :rememberable, :validatable, :invitable,
         :trackable

  as_enum :preferred_language, [:en, :'pt-BR'], map: :string, source: :preferred_language

  validates :first_name, presence: true, length: { minimum: 3, maximum: 100 }
  validates :last_name, length: { minimum: 3, maximum: 100 }, allow_blank: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }

  # acts_as_tenant :account, optional: true
  belongs_to :account, optional: true
  has_many :account_users, dependent: :delete_all
  has_many :accounts, through: :account_users
  has_many :my_accounts, class_name: 'Account', foreign_key: :owner_id, inverse_of: :owner, dependent: :restrict_with_error
  has_many :created_transactions, class_name: 'Transaction', foreign_key: :created_by_id, inverse_of: :created_by
  has_many :updated_transactions, class_name: 'Transaction', foreign_key: :updated_by_id, inverse_of: :updated_by

  has_many :feedback, dependent: :destroy

  has_many :api_tokens, dependent: :destroy

  has_one_attached :avatar
  accepts_nested_attributes_for :my_accounts

  # Callbacks
  after_create :create_default_account_if_needed
  after_create_commit :notify_admin_of_signup



  scope :confirmeds, -> { where.not(confirmed_at: nil) }

  has_settings do |s|
    s.key :transactions, defaults: {
      grouped_expenses: false,
      sort: {
        revenue: {
          column: :due_date,
          direction: :desc
        },
        fixed_expense: {
          column: :due_date,
          direction: :desc
        },
        variable_expense: {
          column: :due_date,
          direction: :desc
        },
        payroll: {
          column: :due_date,
          direction: :desc
        },
        tax: {
          column: :due_date,
          direction: :desc
        },
        transfer: {
          column: :due_date,
          direction: :desc
        },
        all_expenses: {
          column: :due_date,
          direction: :desc
        }
      }
    }
  end

  before_validation :set_preferred_language

  def send_devise_notification(notification, *args)
    devise_mailer.send(notification, self, *args).deliver_later
  end

  def current_account_owner?
    account.owner == self
  end

  def disable
    removed_email = account.owner.email.split('@')
    if self.avatar.attached?
      self.avatar.purge
    end
    self.update_columns(
      account_id: nil,
      email: "deletado-#{SecureRandom.uuid}@#{removed_email.last}",

    )
  end

  def current_account
    effective_account
  end

  def effective_account
    preferred_account = accounts.find_by(id: account_id)
    business_accounts = accounts.business

    if preferred_account.present?
      return preferred_account if preferred_account.business? || business_accounts.none?
    end

    business_accounts.first || accounts.first || account
  end

  def pending_invitations?
    pending_invitations.exists?
  end

  def pending_invitations
    AccountInvitation.where(email:).where.not(account:)
  end

  # @return [Account, nil]
  def my_personal_account
    my_accounts.personal.first
  end

  def change_to_personal_account
    update(account: my_personal_account)
  end

  def receive_email?
    preference_receive_email
  end

  def all_bank_accounts?
    preference_all_bank_accounts
  end

  def payment_date?
    preference_change_date
  end

  def disable_view_recurrence?
    preference_disable_view_recurrence
  end

  def show_initial_tour?
    show_initial_tour
  end

  def beta_tester?
    preference_beta_tester
  end

  def remove_or_keep_free_access
    return if exists_business_account?

    personal_account = my_personal_account
    personal_account&.remove_free_access
  end

  def current_account_user
    account_users.find_by(account:)
  end

  def exists_business_account?
    accounts.business.exists?
  end

  def visible_amount?
    visible_amount
  end

  def collapsed_menu?
    collapsed_menu
  end

  def static_totalizer?
    preference_static_totalizer
  end

  def update_tracked_fields!(request)
    ActiveRecord::Base.connected_to(role: :writing) do
      super
    end
  end

  def update_tracked_fields(request)
    ActiveRecord::Base.connected_to(role: :writing) do
      super
    end
  end

  def pt_br?
    preferred_language == :'pt-BR'
  end

  def self.from_omniauth(auth)
    where(provider: auth.provider, uid: auth.uid).first_or_create do |user|
      user.email = auth.info.email
      user.password = Devise.friendly_token[0, 20]
      user.first_name = auth.info.first_name || auth.info.name.split(' ').first
      user.last_name = auth.info.last_name || auth.info.name.split(' ').last || ''
      user.preferred_language = :'pt-BR'
      user.skip_confirmation!
    end
  end

  def self.from_omniauth_data(auth_data)
    existing = where(provider: auth_data[:provider], uid: auth_data[:uid]).first
    return existing if existing

    # User exists with same email but registered via email/password — link Google account
    by_email = find_by(email: auth_data[:email])
    if by_email
      by_email.update_columns(provider: auth_data[:provider], uid: auth_data[:uid])
      return by_email
    end

    user = new(
      provider:           auth_data[:provider],
      uid:                auth_data[:uid],
      email:              auth_data[:email],
      password:           Devise.friendly_token[0, 20],
      first_name:         auth_data[:first_name] || auth_data[:name]&.split(' ')&.first || '',
      last_name:          auth_data[:last_name]  || auth_data[:name]&.split(' ')&.last  || '',
      preferred_language: :'pt-BR'
    )
    user.skip_confirmation!
    # Skip terms validation — user will accept via modal on first login
    user.save(validate: false)
    user
  end

  private

  def set_preferred_language
    self.preferred_language = :'pt-BR' if preferred_language.blank?
  end

  def notify_admin_of_signup
    AdminNotificationMailer.new_user_signup(self).deliver_later
  rescue => e
    Rails.logger.error "[AdminNotification] Falha ao enviar alerta de cadastro: #{e.message}"
  end

  def create_default_account_if_needed
    return if account.present? || my_accounts.exists?

    # Criar uma account pessoal para o usuário com company aninhada
    account = my_accounts.build(
      account_type: :personal,
      subscription_status: :active,
      free: true,
      owner: self,
      company_attributes: {
        name: "#{first_name} #{last_name}",
        email: email,
        person_type: :natural
      }
    )

    # Criar o account_user com role admin
    account.account_users.build(user: self, role: :admin)

    # Salvar a account (isso vai criar a company automaticamente)
    account.save!

    # Definir esta account como a account atual do usuário
    # update_column pula validações — necessário pois pode ser chamado antes de accepted_terms_at ser setado
    update_column(:account_id, account.id)
  end
end
