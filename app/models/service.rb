# frozen_string_literal: true

# == Schema Information
#
# Table name: offers
#
#  id                  :bigint           not null, primary key
#  cost_price_cents    :bigint           default(0), not null
#  currency            :string           default("BRL"), not null
#  data                :jsonb            not null
#  description         :text
#  discarded_at        :datetime
#  enabled             :string           default("t"), not null
#  internal_code       :string
#  metadata            :jsonb            not null
#  name                :string           not null
#  offer_type_cd       :integer
#  selling_price_cents :bigint           default(0), not null
#  type                :string           not null
#  unit                :string
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  account_id          :bigint           not null
#
# Indexes
#
#  index_offers_on_account_id                            (account_id)
#  index_offers_on_account_id_and_discarded_at           (account_id,discarded_at)
#  index_offers_on_account_id_and_enabled                (account_id,enabled)
#  index_offers_on_account_id_and_internal_code          (account_id,internal_code)
#  index_offers_on_account_id_and_type                   (account_id,type)
#  index_offers_on_discarded_at_and_type_and_account_id  (discarded_at,type,account_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
class Service < Offer
  SERVICE_TYPES = {
    provided: 0,
    consumed: 1,
    both: 2
  }.freeze

  as_enum :service_type, SERVICE_TYPES, source: :offer_type_cd, pluralize_scopes: false

  include Services::Searchable
  include Discardable

  monetize :cost_price_cents, with_model_currency: :currency
  monetize :selling_price_cents, with_model_currency: :currency

  scope :provideds, -> { where(offer_type_cd: [0, 2, nil]) }
  scope :consumeds, -> { where(offer_type_cd: [1, 2, nil]) }

  validates :name, presence: true
  validates :cost_price_cents, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 999_999_999_999 }, allow_blank: true
  validates :selling_price_cents, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 999_999_999_999 }, allow_blank: true
  validates :offer_type_cd, allow_blank: true, inclusion: { in: SERVICE_TYPES.values }

  has_one :nfse_config, class_name: 'ServiceNfseConfig', dependent: :destroy, inverse_of: :service
  accepts_nested_attributes_for :nfse_config, allow_destroy: true

  has_many :transactions, dependent: :restrict_with_error

  # after_initialize :build_nfse_config, if: -> { Flipper.enabled?(:nfse, account) && nfse_config.blank? }

  def selling_price_cents=(value)
    super(TransactionsHelper.parse_str_to_cents(value: value.presence || 0))
  end
end
