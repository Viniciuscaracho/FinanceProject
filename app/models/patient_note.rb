# frozen_string_literal: true

# == Schema Information
#
# Table name: patient_notes
#
#  id         :bigint           not null, primary key
#  content    :text
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  account_id :bigint           not null
#  contact_id :bigint           not null
#
class PatientNote < ApplicationRecord
  acts_as_tenant :account

  belongs_to :account
  belongs_to :contact, class_name: 'Contact', foreign_key: 'contact_id'

  validates :content, presence: true, length: { minimum: 1 }

  scope :recent,      -> { order(created_at: :desc) }
  scope :for_contact, ->(contact_id) { where(contact_id: contact_id) }
end
