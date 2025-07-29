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
class Person < ApplicationRecord
  self.ignored_columns = %w[tsv_body]

  include Discardable
  include UserChanges

  has_person_name

  PERSON_TYPES = {
    undefined_person: 0,
    natural: 1,
    legal: 2
  }.freeze

  as_enum :person_type, PERSON_TYPES

  belongs_to :sector_activity, optional: true, inverse_of: :people
  belongs_to :cnae, optional: true

  has_many :secondary_cnaes, dependent: :destroy
  accepts_nested_attributes_for :secondary_cnaes, allow_destroy: true, reject_if: :all_blank

  has_one_attached :avatar

  validates :name, presence: true, length: { minimum: 2, maximum: 200 }
  validates :phone_number, allow_blank: true, length: { maximum: 20 }
  validates :cell_phone_number, allow_blank: true, length: { maximum: 20 }
  validates :document_1, allow_blank: true, length: { maximum: 20 }
  validates :document_2, allow_blank: true, length: { maximum: 20 }
  validates :description, allow_blank: true, length: { maximum: 1000 }
  validates :birth_date, allow_blank: true, date: { before: proc { Date.current } }
  validates :person_type, presence: true, inclusion: { in: PERSON_TYPES.keys }

  def unmasked_document_1
    return '' if document_1.blank?

    document_1.gsub(/[^0-9]/, '')
  end
end
