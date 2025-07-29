# == Schema Information
#
# Table name: contracts
#
#  id                   :bigint           not null, primary key
#  content              :text
#  description          :text
#  title                :text
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#  contact_id           :bigint
#  contract_template_id :bigint           not null
#
# Indexes
#
#  index_contracts_on_contact_id            (contact_id)
#  index_contracts_on_contract_template_id  (contract_template_id)
#
# Foreign Keys
#
#  fk_rails_...  (contact_id => people.id)
#  fk_rails_...  (contract_template_id => document_templates.id)
#
class Contract < ApplicationRecord
  belongs_to :contract_template
  belongs_to :contact
end
