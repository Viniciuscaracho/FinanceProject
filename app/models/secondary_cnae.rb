# == Schema Information
#
# Table name: secondary_cnaes
#
#  id         :bigint           not null, primary key
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  cnae_id    :bigint           not null
#  person_id  :bigint           not null
#
# Indexes
#
#  index_secondary_cnaes_on_cnae_id                (cnae_id)
#  index_secondary_cnaes_on_person_id              (person_id)
#  index_secondary_cnaes_on_person_id_and_cnae_id  (person_id,cnae_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (cnae_id => enums.id)
#  fk_rails_...  (person_id => people.id)
#
class SecondaryCnae < ApplicationRecord
  belongs_to :person
  belongs_to :cnae
end
