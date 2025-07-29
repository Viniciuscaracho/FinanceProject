# frozen_string_literal: true

# == Schema Information
#
# Table name: banks
#
#  id          :bigint           not null, primary key
#  code        :integer          not null
#  country     :string           not null
#  description :text
#  ispb        :string
#  name        :string           not null
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
# Indexes
#
#  index_banks_on_country_and_code  (country,code) UNIQUE
#
class Bank < ApplicationRecord
  include Banks::Searchable
  include Banks::Loadable

  has_many :bank_accounts

  default_scope { order(:code) }

  def friendly_name
     "#{code} - #{name.slice!(0, 40)}"
  end
end
