# frozen_string_literal: true

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
class ProfessionalDocumentTemplate < DocumentTemplate
  acts_as_tenant :account

  # Tipos de documentos profissionais
  DOCUMENT_TYPES = {
    'prescricao_dietetica'    => 'Prescrição Dietética',
    'plano_alimentar'         => 'Plano Alimentar',
    'diagnostico_nutricional' => 'Diagnóstico Nutricional',
    'evolucao_nutricional'    => 'Evolução Nutricional',
    'orientacao_alimentar'    => 'Orientação Alimentar',
    'orientacao_nutricional'  => 'Orientação Nutricional',
    'laudo_nutricional'       => 'Laudo Nutricional',
    'atestado_consulta'       => 'Atestado de Consulta',
    'recordatorio_24h'        => 'Recordatório Alimentar 24h',
    'evolucao_paciente'       => 'Evolução do Paciente',
    'outro'                   => 'Outro',
  }.freeze

  validates :professional_type, presence: true, if: :enable_sessions?

  def self.create_default_templates(account)
    ApplicationRecord.connected_to(role: ActiveRecord.writing_role) do
      ApplicationRecord.transaction do
        account.professional_document_templates.create!(
          name: 'Plano Alimentar Padrão',
          description: 'Template para criar planos alimentares personalizados',
          default: true,
          professional_type: 'nutricionista',
          enable_sessions: true,
          content: '<div style="max-width: 800px; margin: 0 auto; padding: 40px; font-family: Arial, sans-serif;"><div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #10b981; padding-bottom: 20px;"><h1 style="font-size: 32px; margin: 0; font-weight: bold; color: #10b981;">PLANO ALIMENTAR</h1><p style="font-size: 14px; margin: 10px 0 0 0; color: #666;">[MINHA_EMPRESA]</p><p style="font-size: 12px; margin: 5px 0; color: #666;">CRN: [REGISTRO_PROFISSIONAL]</p></div><div style="margin: 30px 0;"><div style="background-color: #f0fdf4; padding: 20px; border-left: 4px solid #10b981; margin-bottom: 20px;"><h3 style="font-size: 18px; margin-bottom: 10px; color: #059669;">Dados do Paciente</h3><p style="font-size: 14px; margin: 5px 0;"><strong>Nome:</strong> [NOME_CLIENTE]</p><p style="font-size: 14px; margin: 5px 0;"><strong>Data:</strong> [DATA_ATUAL]</p><p style="font-size: 14px; margin: 5px 0;"><strong>Sessão:</strong> [NUMERO_SESSAO] de [TOTAL_SESSOES]</p></div><div style="margin: 30px 0;"><h3 style="font-size: 20px; margin-bottom: 15px; color: #059669; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Orientações Alimentares</h3><div style="line-height: 1.8; font-size: 16px;">[CONTEUDO_DOCUMENTO]</div></div><div style="margin: 30px 0; padding: 20px; background-color: #fffbeb; border-left: 4px solid #f59e0b;"><h4 style="font-size: 16px; margin-bottom: 10px; color: #d97706;">Observações Importantes</h4><p style="font-size: 14px; line-height: 1.6; margin: 0;">Seguir rigorosamente as orientações fornecidas. Em caso de dúvidas, entre em contato.</p></div></div><div style="margin-top: 40px; text-align: center; padding-top: 20px; border-top: 1px solid #ddd;"><p style="font-size: 12px; color: #666; margin: 0;">Documento gerado em [DATA_ATUAL]</p></div></div>'
        )
      end
    end
  end
end

