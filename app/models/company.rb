# frozen_string_literal: true

# == Schema Information
#
# Table name: people
#
#  id                                                       :bigint           not null, primary key
#  birth_date                                               :date
#  cell_phone_number                                        :string
#  cert_password(Senha do Certificado Digital)              :string
#  contact_type_cd                                          :integer          default(0), not null
#  description                                              :text
#  discarded_at                                             :datetime
#  document_1                                               :string
#  document_2                                               :string
#  document_3(Inscrição Municial (PJ) / CNH (PF))           :string
#  email                                                    :string
#  first_name                                               :string           not null
#  last_name                                                :string
#  person_type_cd                                           :integer          default(0), not null
#  phone_number                                             :string
#  screen_name(Nome fantasia para PJ / Nome social para PF) :string
#  type                                                     :string           not null
#  created_at                                               :datetime         not null
#  updated_at                                               :datetime         not null
#  account_id                                               :bigint
#  cnae_id                                                  :bigint
#  created_by_id                                            :bigint
#  sector_activity_id                                       :bigint
#  updated_by_id                                            :bigint
#
# Indexes
#
#  index_people_on_account_id                                   (account_id)
#  index_people_on_account_id_and_contact_type_cd               (account_id,contact_type_cd)
#  index_people_on_account_id_and_type_and_discarded_at         (account_id,type,discarded_at)
#  index_people_on_cnae_id                                      (cnae_id)
#  index_people_on_contact_type_cd                              (contact_type_cd)
#  index_people_on_created_by_id                                (created_by_id)
#  index_people_on_discarded_at                                 (discarded_at)
#  index_people_on_discarded_at_and_type_and_account_id_and_id  (discarded_at,type,account_id,id)
#  index_people_on_id_and_type                                  (id,type)
#  index_people_on_person_type_cd                               (person_type_cd)
#  index_people_on_sector_activity_id                           (sector_activity_id)
#  index_people_on_tsv_body                                     (tsv_body) USING gin
#  index_people_on_type                                         (type)
#  index_people_on_updated_by_id                                (updated_by_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (cnae_id => enums.id)
#  fk_rails_...  (created_by_id => users.id)
#  fk_rails_...  (sector_activity_id => segments.id)
#  fk_rails_...  (updated_by_id => users.id)
#
class Company < Person
  include Companies::NaturalPerson
  include Companies::NuvemFiscal
  include Addresses::Addressable
  include EmailDeliverable
  include Integrations::NuvemFiscal::Tomador
  include Integrations::NuvemFiscal::Prestador

  has_prefix_id :co, override_find: false, override_param: false

  # Validations
  validates :email, presence: true, length: { maximum: 100 }, format: { with: /\A([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})\z/i }
  validates :document_1, presence: true, uniqueness: { case_sensitive: false }, length: { maximum: 20 }, on: :update, if: -> { account.nfse_enabled? }
  validates :document_3, presence: true, on: :update, if: -> { account.nfse_enabled? }
  validates_associated :addresses, :nfse_config

  # Associations
  has_one :account, inverse_of: :company, dependent: :restrict_with_error
  has_one :nfse_config, class_name: 'CompanyNfseConfig', dependent: :destroy
  has_one_attached :logo
  has_one_attached :cert_file

  # Nested Attributes
  accepts_nested_attributes_for :nfse_config, allow_destroy: true, reject_if: :all_blank

  # Delegates
  delegate :business?, to: :account, allow_nil: true

  # Callbacks
  after_create_commit :create_customer_to_processor, if:-> { account.present? }
  after_update_commit :update_customer_to_processor
  after_update_commit  do
    publish :company_updated, record: self
  end

  # Create or Update Customer from Processor Payment
  def create_customer_to_processor
    return if Rails.env.test?
    return unless update_stripe_customer?

    PaymentProcessors::CreateCustomerJob.perform_later(account.id, stripe_customer_params)
  end

  def update_customer_to_processor
    return if Rails.env.test?
    return unless update_stripe_customer?

    PaymentProcessors::UpdateCustomerJob.perform_later(account.id, stripe_customer_params)
  end

  def cnaes
    return [] if cnae_id.blank? && secondary_cnaes.empty?

    Cnae.where(id: [cnae_id] + secondary_cnaes.pluck(:cnae_id))
  end

  def grouped_cnaes
    {
      Company.human_attribute_name('cnae_id').upcase => [[cnae&.name, cnae&.code]],
      Company.human_attribute_name('secondary_cnaes').upcase => secondary_cnaes.includes(:cnae).collect(&:cnae).map { |cnae| [cnae.name, cnae.code] }
    }
  end

  protected

  def update_stripe_customer?
    email_previously_changed? ||
      first_name_previously_changed? ||
      last_name_previously_changed? ||
      phone_number_previously_changed?
  end

  def stripe_customer_params
    {
      email:,
      name:,
      phone: phone_number,
      preferred_locales: [account.owner.preferred_language, 'en'],
      metadata: {
        account_id: account.id,
        owner_id: account.owner_id,
        owner_email: account.owner.email,
        owner_name: account.owner.name
      }
    }
  end
end
