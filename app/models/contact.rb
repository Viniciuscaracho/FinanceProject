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
class Contact < Person
  CONTACT_TYPES = {
    undefined_contact: 0,
    customer: 1,
    employee: 2,
    supplier: 3,
    partner: 4,
    associate: 5
  }.freeze

  as_enum :contact_type, CONTACT_TYPES
  audited except: %i[tsv_body], associated_with: :account
  acts_as_tenant :account, counter_cache: true
  has_prefix_id :cct, override_find: false, override_param: false

  include Integrations::NuvemFiscal::Tomador
  include Addresses::Addressable
  include Contacts::Searchable
  include Attachable

  scope :birthday_by_month, ->(month:) { where('extract(month from birth_date) = ?', month) }
  scope :birthday_by_day_and_month, ->(day:, month:) { where('extract(month from birth_date) = ? AND extract(day from birth_date) = ?', month, day) }
  scope :birthday_this_month, -> { birthday_by_month(month: Date.current.month) }

  validates :email, allow_blank: true,
            length: { maximum: 100 },
            format: { with: /\A([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})\z/i }

  has_many :transactions, dependent: :restrict_with_error
  has_many :statement_items, dependent: :restrict_with_error
  has_many :contracts, dependent: :restrict_with_error
  has_many :patient_documents, foreign_key: :contact_id, dependent: :delete_all

  validates :contact_type, presence: true, inclusion: { in: CONTACT_TYPES.keys }
  validates :document_1, allow_blank: true, cpf_or_cnpj: true, if: :validate_cpf_or_cnpj?

  after_update_commit do
    publish 'contact_updated', record: self
  end

  after_create_commit do
    publish 'contact_created', record: self
  end

  after_destroy_commit do
    publish 'contact_destroyed', record: self
  end

  def name
    return "#{super} (#{I18n.t('shared.discarded')})" if discarded?

    super
  end

  def event_attributes
    super.slice(:id, :account_id, :first_name, :last_name, :updated_at, :discarded_at)
  end

  def event_previous_changes
    super.slice(:first_name, :last_name, :updated_at, :discarded_at)
  end

  def discard_or_destroy!
    if transactions.exists?
      discard
    else
      destroy!
    end
  end

  private

  def validate_cpf_or_cnpj?
    I18n.locale == 'pt-BR' && (natural? || legal?)
  end

  def event_name
    return 'contact_deleted' if discarded?

    'contact_updated'
  end
end
