# frozen_string_literal: true

# == Schema Information
#
# Table name: referral_codes
#
#  id                                                 :bigint           not null, primary key
#  account_type_cd                                    :integer          default(0), not null
#  benefit(Benefit (in percentage))                   :integer          default(0), not null
#  benefit_type_cd(Benefit type)                      :integer          default(0), not null
#  code(Unique referral code)                         :string           not null
#  create_free_personal_account                       :boolean          default(TRUE), not null
#  description(Description of the referral code)      :text
#  discarded_at                                       :datetime
#  name(Name of the referral code)                    :string           not null
#  referrer_type                                      :string
#  trial_days                                         :integer          default(30), not null
#  created_at                                         :datetime         not null
#  updated_at                                         :datetime         not null
#  referrer_id(Referrer that owns this referral code) :bigint
#
# Indexes
#
#  index_referral_codes_on_code          (code) UNIQUE
#  index_referral_codes_on_discarded_at  (discarded_at)
#  index_referral_codes_on_referrer      (referrer_type,referrer_id)
#
class ReferralCode < ApplicationRecord
  include Discardable

  BENEFIT_TYPES = {
    commission: 0,
    discount: 1
  }.freeze

  ACCOUNT_TYPES = {
    both: 0,
    business: 1,
    personal: 2
  }.freeze

  as_enum :benefit_type, BENEFIT_TYPES
  as_enum :account_type, ACCOUNT_TYPES

  # Validations
  validates :name, :benefit, :benefit_type, presence: true
  validates :benefit, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validates :trial_days, presence: true, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 30 }

  belongs_to :referrer, polymorphic: true
  has_many :referees, class_name: 'Account', inverse_of: :referral_code, dependent: :nullify

  before_create :generate_code
  after_create :upsert_coupon, if: :discount?

  def to_param
    code
  end

  def short_referral_url
    Rails.application.routes.url_helpers.short_referral_code_url(id: code)
  end

  alias url short_referral_url

  private

  def upsert_coupon
    return if commission?
    return if benefit.zero?

    coupon = begin
      Stripe::Coupon.retrieve(code)
    rescue StandardError
      nil
    end
    return coupon if coupon.present?

    Stripe::Coupon.create({ name:, duration: 'forever', id: code, percent_off: benefit })
  end

  def generate_code
    loop do
      break unless ReferralCode.where(code: (self.code = SecureRandom.alphanumeric(12).upcase)).exists?
    end
  end
end
