# == Schema Information
#
# Table name: document_templates
#
#  id                                                                                  :bigint           not null, primary key
#  content                                                                             :text
#  default                                                                             :boolean          default(FALSE)
#  description                                                                         :text
#  enable_sessions                                                                     :boolean          default(FALSE), not null
#  name                                                                                :string           not null
#  professional_type(Tipo de profissional (psicólogo, professor, nutricionista, etc.)) :string
#  session_count                                                                       :integer
#  session_number                                                                      :integer
#  session_type                                                                        :string
#  transaction_type_cd                                                                 :integer
#  type                                                                                :string
#  created_at                                                                          :datetime         not null
#  updated_at                                                                          :datetime         not null
#  account_id                                                                          :bigint           not null
#
# Indexes
#
#  index_document_templates_on_account_id                  (account_id)
#  index_document_templates_on_type_and_account_id_and_id  (type,account_id,id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
class DocumentTemplate < ApplicationRecord
  validates :name, presence: true

  # Tipos de profissionais suportados
  PROFESSIONAL_TYPES = {
    'psicologo' => 'Psicólogo',
    'professor' => 'Professor',
    'nutricionista' => 'Nutricionista',
    'fisioterapeuta' => 'Fisioterapeuta',
    'medico' => 'Médico',
    'dentista' => 'Dentista',
    'personal_trainer' => 'Personal Trainer',
    'coach' => 'Coach',
    'terapeuta' => 'Terapeuta',
    'outro' => 'Outro'
  }.freeze

  has_settings do |s|
    s.key :receipt, defaults: {
      header: false
    }

    s.key :contract, defaults: {
      header: false
    }

    s.key :invoice, defaults: {
      show_header: true,
      show_issue_date: false,
      show_due_date: true,
      show_recipient: true,
      show_detailed_lines: false,
      show_discount_info: false,
      show_tax_info: false,
      show_payment_info: true
    }
  end

  def self.subclasses
    Object.singleton_class.instance_method(:subclasses).bind(self).call
  end

  def professional_type_label
    PROFESSIONAL_TYPES[professional_type] || professional_type&.humanize || 'Não especificado'
  end
end
