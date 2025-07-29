# frozen_string_literal: true

# == Schema Information
#
# Table name: addresses
#
#  id               :bigint           not null, primary key
#  address_line1    :string
#  address_line2    :string
#  address_number   :string
#  addressable_type :string           not null
#  city             :string
#  country          :string
#  district         :string
#  ibge_city_code   :string
#  postcode         :string
#  state            :string
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  addressable_id   :bigint           not null
#
# Indexes
#
#  index_addresses_on_addressable  (addressable_type,addressable_id)
#
class Address < ApplicationRecord
  audited associated_with: :addressable

  belongs_to :addressable, polymorphic: true

  validates :address_line1, :address_number, :district, :city, :state, :postcode, presence: true, if: :validates_company_nfse_config?

  before_validation :populate_city_code

  def full_name

    if attributes.values_at('address_line1', 'address_number', 'address_line2', 'city', 'state', 'postcode').all?(&:blank?)
      return ''
    end

    "#{address_line1}, nº #{address_number}, #{address_line2}. #{city} - #{State.find_by(key: state)&.value}. CEP #{postcode&.gsub(/(\d{5})(\d{3})/, '\1-\2')}"

  end

  def line_1
    [[address_line1, address_number].join(', '), address_line2].reject(&:blank?).join(' - ')
  end

  def line_2
    postal_code = postcode.present? ? [I18n.t('shared.postcode'), postcode].reject(&:blank?).join(' ') : nil
    [[district, city, state].reject(&:blank?).join(' - '), postal_code].reject(&:blank?).join('. ')
  end

  def validates_company_nfse_config?
    return false unless addressable.is_a?(Company)

    addressable.account.nfse_enabled?
  end

  def populate_city_code
    return if city.blank?

    self.ibge_city_code ||= City.find_by(value: city)&.code
  end
end
