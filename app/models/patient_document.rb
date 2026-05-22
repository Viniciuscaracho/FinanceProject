# frozen_string_literal: true

# == Schema Information
#
# Table name: patient_documents
#
#  id            :bigint           not null, primary key
#  content       :text
#  document_type :string
#  public_token  :string           not null
#  shared        :boolean          default(FALSE), not null
#  title         :string           not null
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  account_id    :bigint           not null
#  contact_id    :bigint           not null
#
# Indexes
#
#  index_patient_documents_on_account_id                 (account_id)
#  index_patient_documents_on_account_id_and_contact_id  (account_id,contact_id)
#  index_patient_documents_on_contact_id                 (contact_id)
#  index_patient_documents_on_public_token               (public_token) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (contact_id => people.id)
#
class PatientDocument < ApplicationRecord
  acts_as_tenant :account

  belongs_to :contact, class_name: 'Contact', foreign_key: 'contact_id'
  belongs_to :account

  DOCUMENT_TYPES = {
    'plano_alimentar'        => 'Plano Alimentar',
    'orientacao_nutricional' => 'Orientação Nutricional',
    'evolucao_paciente'      => 'Evolução do Paciente',
    'orientacao_terapeutica' => 'Orientação Terapêutica',
    'anotacao_sessao'        => 'Anotação de Sessão',
    'outro'                  => 'Outro'
  }.freeze

  before_create :generate_public_token

  validates :title, presence: true, length: { maximum: 200 }
  validates :contact_id, presence: true
  validates :public_token, uniqueness: true

  scope :recent,      -> { order(updated_at: :desc) }
  scope :for_contact, ->(contact_id) { where(contact_id: contact_id) }
  scope :shared,      -> { where(shared: true) }

  def document_type_label
    DOCUMENT_TYPES[document_type] || document_type
  end

  def public_url
    base = ENV.fetch('FRONTEND_URL', 'http://localhost:5173')
    "#{base}/d/#{public_token}"
  end

  private

  def generate_public_token
    loop do
      token = SecureRandom.urlsafe_base64(16)
      unless PatientDocument.exists?(public_token: token)
        self.public_token = token
        break
      end
    end
  end
end
