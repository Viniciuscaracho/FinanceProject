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
class InvoiceTemplate < DocumentTemplate
  acts_as_tenant :account

  def assign_settings(settings)
    settings.each do |key, value|
      settings(:invoice).send("#{key}=", value.to_boolean)
    end
  end

  def show_header=(value)
    settings(:invoice).show_header = value.to_boolean
  end

  def show_header
    settings(:invoice).show_header
  end

  def show_issue_date=(value)
    settings(:invoice).show_issue_date = value.to_boolean
  end

  def show_issue_date
    settings(:invoice).show_issue_date
  end

  def show_due_date=(value)
    settings(:invoice).show_due_date = value.to_boolean
  end

  def show_due_date
    settings(:invoice).show_due_date
  end

  def show_recipient=(value)
    settings(:invoice).show_recipient = value.to_boolean
  end

  def show_recipient
    settings(:invoice).show_recipient
  end

  def show_detailed_lines=(value)
    settings(:invoice).show_detailed_lines = value.to_boolean
  end

  def show_detailed_lines
    settings(:invoice).show_detailed_lines
  end

  def show_discount_info=(value)
    settings(:invoice).show_discount_info = value.to_boolean
  end

  def show_discount_info
    settings(:invoice).show_discount_info
  end

  def show_tax_info=(value)
    settings(:invoice).show_tax_info = value.to_boolean
  end

  def show_tax_info
    settings(:invoice).show_tax_info
  end

  def show_payment_info=(value)
    settings(:invoice).show_payment_info = value.to_boolean
  end

  def show_payment_info
    settings(:invoice).show_payment_info
  end

  def self.create_default_invoice_template(account)
    return if account.invoice_templates.exists?

    ApplicationRecord.connected_to(role: ActiveRecord.writing_role) do
      ApplicationRecord.transaction do
        # Fatura Padrão - Modelo Profissional
        invoice_template = account.invoice_templates.create!(
          name: 'Fatura Padrão', 
          description: 'Modelo padrão de fatura profissional',
          default: true,
          content: '<div style="max-width: 800px; margin: 0 auto; padding: 40px; font-family: Arial, sans-serif;"><div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #333; padding-bottom: 20px;"><h1 style="font-size: 32px; margin: 0; font-weight: bold;">FATURA</h1><p style="font-size: 14px; margin: 10px 0 0 0; color: #666;">[MINHA_EMPRESA]</p><p style="font-size: 12px; margin: 5px 0; color: #666;">CPF/CNPJ: [MINHA_EMPRESA_DOCUMENTO]</p><p style="font-size: 12px; margin: 5px 0; color: #666;">[MINHA_EMPRESA_CIDADE]/[MINHA_EMPRESA_ESTADO]</p></div><div style="margin: 30px 0;"><div style="display: flex; justify-content: space-between; margin-bottom: 30px;"><div style="flex: 1;"><h3 style="font-size: 18px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Dados do Emitente</h3><p style="font-size: 14px; margin: 5px 0;"><strong>Nome:</strong> [MINHA_EMPRESA]</p><p style="font-size: 14px; margin: 5px 0;"><strong>CPF/CNPJ:</strong> [MINHA_EMPRESA_DOCUMENTO]</p><p style="font-size: 14px; margin: 5px 0;"><strong>Endereço:</strong> [MINHA_EMPRESA_CIDADE]/[MINHA_EMPRESA_ESTADO]</p></div><div style="flex: 1; margin-left: 30px;"><h3 style="font-size: 18px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Dados do Cliente</h3><p style="font-size: 14px; margin: 5px 0;"><strong>Nome:</strong> [NOME_CLIENTE]</p><p style="font-size: 14px; margin: 5px 0;"><strong>CPF/CNPJ:</strong> [DOCUMENTO_CLIENTE]</p></div></div><div style="margin: 30px 0; padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd;"><h3 style="font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Informações da Fatura</h3><div style="display: flex; justify-content: space-between; margin-bottom: 10px;"><span style="font-size: 14px;"><strong>Data de Emissão:</strong></span><span style="font-size: 14px;">[DATA_ATUAL]</span></div><div style="display: flex; justify-content: space-between; margin-bottom: 10px;"><span style="font-size: 14px;"><strong>Data de Vencimento:</strong></span><span style="font-size: 14px;">[DATA_VENCIMENTO]</span></div><div style="display: flex; justify-content: space-between; margin-top: 20px; padding-top: 20px; border-top: 2px solid #333;"><span style="font-size: 20px; font-weight: bold;">Valor Total:</span><span style="font-size: 24px; font-weight: bold; color: #2563eb;">[VALOR_TOTAL]</span></div></div><div style="margin-top: 40px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107;"><h4 style="font-size: 16px; margin-bottom: 10px;">Instruções de Pagamento</h4><p style="font-size: 14px; line-height: 1.6; margin: 0;">O pagamento deve ser efetuado até a data de vencimento através de transferência bancária, PIX ou depósito identificado. Em caso de dúvidas, entre em contato conosco.</p></div><div style="margin-top: 40px; text-align: center; padding-top: 20px; border-top: 1px solid #ddd;"><p style="font-size: 12px; color: #666; margin: 0;">Esta é uma fatura gerada automaticamente. Em caso de dúvidas, entre em contato.</p></div></div>'
        )
        invoice_template.settings(:invoice).show_header = true
        invoice_template.settings(:invoice).show_issue_date = true
        invoice_template.settings(:invoice).show_due_date = true
        invoice_template.settings(:invoice).show_recipient = true
        invoice_template.settings(:invoice).show_payment_info = true
        invoice_template.save!

        # Fatura para Consultórios - Modelo Específico
        invoice_template = account.invoice_templates.create!(
          name: 'Fatura de Sessão Médica/Psicológica', 
          description: 'Modelo específico para consultórios de saúde',
          default: false,
          content: '<div style="max-width: 800px; margin: 0 auto; padding: 40px; font-family: Arial, sans-serif;"><div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #2563eb; padding-bottom: 20px;"><h1 style="font-size: 32px; margin: 0; font-weight: bold; color: #2563eb;">FATURA DE CONSULTA</h1><p style="font-size: 14px; margin: 10px 0 0 0; color: #666;">[MINHA_EMPRESA]</p><p style="font-size: 12px; margin: 5px 0; color: #666;">CPF/CNPJ: [MINHA_EMPRESA_DOCUMENTO]</p><p style="font-size: 12px; margin: 5px 0; color: #666;">Registro Profissional: [CRP/CRM/CRN]</p><p style="font-size: 12px; margin: 5px 0; color: #666;">[MINHA_EMPRESA_CIDADE]/[MINHA_EMPRESA_ESTADO]</p></div><div style="margin: 30px 0;"><div style="display: flex; justify-content: space-between; margin-bottom: 30px;"><div style="flex: 1;"><h3 style="font-size: 18px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; color: #2563eb;">Dados do Profissional</h3><p style="font-size: 14px; margin: 5px 0;"><strong>Nome:</strong> [MINHA_EMPRESA]</p><p style="font-size: 14px; margin: 5px 0;"><strong>CPF/CNPJ:</strong> [MINHA_EMPRESA_DOCUMENTO]</p><p style="font-size: 14px; margin: 5px 0;"><strong>Registro:</strong> [CRP/CRM/CRN]</p></div><div style="flex: 1; margin-left: 30px;"><h3 style="font-size: 18px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; color: #2563eb;">Dados do Paciente</h3><p style="font-size: 14px; margin: 5px 0;"><strong>Nome:</strong> [NOME_CLIENTE]</p><p style="font-size: 14px; margin: 5px 0;"><strong>CPF:</strong> [DOCUMENTO_CLIENTE]</p></div></div><div style="margin: 30px 0; padding: 20px; background-color: #eff6ff; border: 1px solid #2563eb; border-radius: 8px;"><h3 style="font-size: 18px; margin-bottom: 15px; color: #2563eb;">Informações da Consulta</h3><div style="display: flex; justify-content: space-between; margin-bottom: 10px;"><span style="font-size: 14px;"><strong>Data da Consulta:</strong></span><span style="font-size: 14px;">[DATA_ATUAL]</span></div><div style="display: flex; justify-content: space-between; margin-bottom: 10px;"><span style="font-size: 14px;"><strong>Data de Vencimento:</strong></span><span style="font-size: 14px;">[DATA_VENCIMENTO]</span></div><div style="display: flex; justify-content: space-between; margin-top: 20px; padding-top: 20px; border-top: 2px solid #2563eb;"><span style="font-size: 20px; font-weight: bold;">Valor Total:</span><span style="font-size: 24px; font-weight: bold; color: #2563eb;">[VALOR_TOTAL]</span></div></div><div style="margin-top: 40px; padding: 20px; background-color: #f0fdf4; border-left: 4px solid #10b981;"><h4 style="font-size: 16px; margin-bottom: 10px; color: #059669;">Observações Importantes</h4><p style="font-size: 14px; line-height: 1.6; margin: 0;">Esta fatura refere-se a serviços de saúde prestados. O pagamento pode ser realizado através de PIX, transferência bancária ou dinheiro. Em caso de reembolso por plano de saúde, apresente esta fatura junto com os documentos necessários.</p></div><div style="margin-top: 40px; text-align: center; padding-top: 20px; border-top: 1px solid #ddd;"><p style="font-size: 12px; color: #666; margin: 0;">Esta é uma fatura gerada automaticamente. Em caso de dúvidas, entre em contato.</p></div></div>'
        )
        invoice_template.settings(:invoice).show_header = true
        invoice_template.settings(:invoice).show_issue_date = true
        invoice_template.settings(:invoice).show_due_date = true
        invoice_template.settings(:invoice).show_recipient = true
        invoice_template.settings(:invoice).show_payment_info = true
        invoice_template.save!
      end
    end
  end
end
