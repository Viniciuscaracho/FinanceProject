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
class ReceiptTemplate < DocumentTemplate
  TRANSACTION_TYPES = %i[revenue expense].freeze

  as_enum :transaction_type, TRANSACTION_TYPES

  acts_as_tenant :account

  def assign_settings=(settings)
    settings.each do |key, value|
      settings(:receipt).send("#{key}=", value.to_boolean)
    end
  end

  def header
    settings(:receipt).header
  end

  def header=(value)
    settings(:receipt).header = value.to_boolean
  end

  def show_header?
    settings(:receipt).header
  end

  def self.create_default_templates(account)
    ActsAsTenant.with_tenant(account) do
      ReceiptTemplate.transaction do
        # Recibo de Recebimento - Modelo Profissional
        receipt_template = account.receipt_templates.new(
          name: "Recebimento Padrão",
          description: "Modelo padrão para recibos de receita",
          default: true,
          transaction_type_cd: 0,
          content: '<div style="max-width: 800px; margin: 0 auto; padding: 40px; font-family: Arial, sans-serif;"><h2 style="text-align: center; font-size: 28px; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px;">RECIBO</h2><div style="margin: 30px 0;"><p style="font-size: 16px; line-height: 1.8; text-align: justify; margin-bottom: 20px;">Eu, <strong>[MINHA_EMPRESA]</strong>, inscrito(a) no CPF/CNPJ: <strong>[MINHA_EMPRESA_DOCUMENTO]</strong>, com endereço em [MINHA_EMPRESA_CIDADE]/[MINHA_EMPRESA_ESTADO], declaro para os devidos fins que recebi de <strong>[NOME_CLIENTE]</strong>, inscrito(a) no CPF/CNPJ: <strong>[DOCUMENTO_CLIENTE]</strong>, a quantia de <strong style="font-size: 18px;">[VALOR_ITEM]</strong>, referente a <strong>[DESCRICAO_ITEM]</strong>.</p><p style="font-size: 16px; line-height: 1.8; text-align: justify; margin-bottom: 20px;">Código da transação: <strong>[CODIGO_ITEM]</strong></p><p style="font-size: 16px; line-height: 1.8; text-align: justify; margin-bottom: 20px;">Data da transação: <strong>[DATA_ITEM]</strong></p><p style="font-size: 16px; line-height: 1.8; text-align: justify; margin-bottom: 20px;">Categoria: <strong>[CATEGORIA_ITEM]</strong></p><p style="font-size: 16px; line-height: 1.8; text-align: justify; margin-top: 30px;">E por ser expressão da verdade, firmo o presente recibo na cidade de <strong>[MINHA_EMPRESA_CIDADE]</strong>, <strong>[MINHA_EMPRESA_ESTADO]</strong>, em <strong>[DATA_ATUAL]</strong>.</p></div><div style="margin-top: 60px; text-align: center;"><div style="border-top: 1px solid #333; padding-top: 20px; margin-top: 40px;"><p style="font-size: 14px; margin: 0;"><strong>[MINHA_EMPRESA]</strong></p><p style="font-size: 12px; margin: 5px 0 0 0;">CPF/CNPJ: [MINHA_EMPRESA_DOCUMENTO]</p></div></div></div>'
        )
        receipt_template.settings(:receipt).header = true
        receipt_template.save!

        # Recibo de Despesa - Modelo Profissional
        receipt_template = account.receipt_templates.new(
          name: "Despesa Padrão",
          description: "Modelo padrão para recibos de despesa",
          default: true,
          transaction_type_cd: 1,
          content: '<div style="max-width: 800px; margin: 0 auto; padding: 40px; font-family: Arial, sans-serif;"><h2 style="text-align: center; font-size: 28px; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px;">RECIBO DE DESPESA</h2><div style="margin: 30px 0;"><p style="font-size: 16px; line-height: 1.8; text-align: justify; margin-bottom: 20px;">Eu, <strong>[NOME_CLIENTE]</strong>, inscrito(a) no CPF/CNPJ: <strong>[DOCUMENTO_CLIENTE]</strong>, declaro para os devidos fins que recebi de <strong>[MINHA_EMPRESA]</strong>, inscrito(a) no CPF/CNPJ: <strong>[MINHA_EMPRESA_DOCUMENTO]</strong>, com endereço em [MINHA_EMPRESA_CIDADE]/[MINHA_EMPRESA_ESTADO], a quantia de <strong style="font-size: 18px;">[VALOR_ITEM]</strong>, referente a <strong>[DESCRICAO_ITEM]</strong>.</p><p style="font-size: 16px; line-height: 1.8; text-align: justify; margin-bottom: 20px;">Código da transação: <strong>[CODIGO_ITEM]</strong></p><p style="font-size: 16px; line-height: 1.8; text-align: justify; margin-bottom: 20px;">Data da transação: <strong>[DATA_ITEM]</strong></p><p style="font-size: 16px; line-height: 1.8; text-align: justify; margin-bottom: 20px;">Categoria: <strong>[CATEGORIA_ITEM]</strong></p><p style="font-size: 16px; line-height: 1.8; text-align: justify; margin-top: 30px;">E por ser expressão da verdade, firmo o presente recibo na cidade de <strong>[MINHA_EMPRESA_CIDADE]</strong>, <strong>[MINHA_EMPRESA_ESTADO]</strong>, em <strong>[DATA_ATUAL]</strong>.</p></div><div style="margin-top: 60px; text-align: center;"><div style="border-top: 1px solid #333; padding-top: 20px; margin-top: 40px;"><p style="font-size: 14px; margin: 0;"><strong>[NOME_CLIENTE]</strong></p><p style="font-size: 12px; margin: 5px 0 0 0;">CPF/CNPJ: [DOCUMENTO_CLIENTE]</p></div></div></div>'
        )
        receipt_template.settings(:receipt).header = true
        receipt_template.save!

        # Recibo de Adiantamento de Salário
        receipt_template = account.receipt_templates.new(
          name: "Recibo de Adiantamento de Salário",
          description: "Modelo para adiantamento de salário",
          default: true,
          transaction_type_cd: 1,
          content: '<div style="max-width: 800px; margin: 0 auto; padding: 40px; font-family: Arial, sans-serif;"><h2 style="text-align: center; font-size: 28px; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px;">RECIBO DE ADIANTAMENTO DE SALÁRIO</h2><div style="margin: 30px 0;"><p style="font-size: 16px; line-height: 1.8; text-align: justify; margin-bottom: 20px;">Recebi de <strong>[MINHA_EMPRESA]</strong>, inscrito(a) no CPF/CNPJ: <strong>[MINHA_EMPRESA_DOCUMENTO]</strong>, empregador(a), a quantia de <strong style="font-size: 18px;">[VALOR_ITEM]</strong>, correspondente a adiantamento de salário do mês de <strong>[MES_ATUAL]</strong>, a ser descontado no próximo pagamento.</p><p style="font-size: 16px; line-height: 1.8; text-align: justify; margin-top: 30px;">E para clareza, firmamos o presente na cidade de <strong>[MINHA_EMPRESA_CIDADE]</strong>, <strong>[MINHA_EMPRESA_ESTADO]</strong>, em <strong>[DATA_ATUAL]</strong>.</p></div><div style="margin-top: 60px; text-align: center;"><div style="border-top: 1px solid #333; padding-top: 20px; margin-top: 40px;"><p style="font-size: 14px; margin: 0;"><strong>[NOME_CLIENTE]</strong> (empregado)</p><p style="font-size: 12px; margin: 5px 0 0 0;">CPF: [DOCUMENTO_CLIENTE]</p></div></div></div>'
        )
        receipt_template.settings(:receipt).header = true
        receipt_template.save!

        # Recibo de Prestação de Serviços - Modelo para Consultórios
        receipt_template = account.receipt_templates.new(
          name: "Recibo de Sessão Médica/Psicológica",
          description: "Modelo específico para consultórios de saúde",
          default: false,
          transaction_type_cd: 0,
          content: '<div style="max-width: 800px; margin: 0 auto; padding: 40px; font-family: Arial, sans-serif;"><h2 style="text-align: center; font-size: 28px; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px;">RECIBO DE SESSÃO</h2><div style="margin: 30px 0;"><p style="font-size: 16px; line-height: 1.8; text-align: justify; margin-bottom: 20px;">Eu, <strong>[MINHA_EMPRESA]</strong>, inscrito(a) no CPF/CNPJ: <strong>[MINHA_EMPRESA_DOCUMENTO]</strong>, profissional de saúde, declaro para os devidos fins que recebi de <strong>[NOME_CLIENTE]</strong>, inscrito(a) no CPF: <strong>[DOCUMENTO_CLIENTE]</strong>, a quantia de <strong style="font-size: 18px;">[VALOR_ITEM]</strong>, referente à <strong>[DESCRICAO_ITEM]</strong> realizada em <strong>[DATA_ITEM]</strong>.</p><p style="font-size: 16px; line-height: 1.8; text-align: justify; margin-bottom: 20px;">Código da sessão: <strong>[CODIGO_ITEM]</strong></p><p style="font-size: 16px; line-height: 1.8; text-align: justify; margin-top: 30px;">E por ser expressão da verdade, firmo o presente recibo na cidade de <strong>[MINHA_EMPRESA_CIDADE]</strong>, <strong>[MINHA_EMPRESA_ESTADO]</strong>, em <strong>[DATA_ATUAL]</strong>.</p></div><div style="margin-top: 60px; text-align: center;"><div style="border-top: 1px solid #333; padding-top: 20px; margin-top: 40px;"><p style="font-size: 14px; margin: 0;"><strong>[MINHA_EMPRESA]</strong></p><p style="font-size: 12px; margin: 5px 0 0 0;">CPF/CNPJ: [MINHA_EMPRESA_DOCUMENTO]</p><p style="font-size: 12px; margin: 5px 0 0 0;">Registro Profissional: [CRP/CRM/CRN]</p></div></div></div>'
        )
        receipt_template.settings(:receipt).header = true
        receipt_template.save!
      end
    end
  end
end
