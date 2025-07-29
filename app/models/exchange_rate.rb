# == Schema Information
#
# Table name: exchange_rates
#
#  id         :bigint           not null, primary key
#  from       :string(3)        not null
#  rate       :decimal(20, 5)   not null
#  to         :string(3)        not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
# Indexes
#
#  index_exchange_rates_on_from_and_to  (from,to)
#
class ExchangeRate < ApplicationRecord
  def add_rate(from_iso_code, to_iso_code, rate)
    return if rate.nil?

    exchange_rate = ExchangeRate.find_or_initialize_by(from: from_iso_code, to: to_iso_code)
    exchange_rate.rate = rate
    exchange_rate.save!
  end

  def get_rate(from_iso_code, to_iso_code)
    exchange_rate = ExchangeRate.find_by(from: from_iso_code, to: to_iso_code)
    exchange_rate&.rate
  end

  def each_rate
    return ExchangeRate.find_each unless block_given?

    ExchangeRate.find_each do |rate|
      yield rate.from, rate.to, rate.rate
    end
  end

  def transaction(&block)
    block.call
  end
end
