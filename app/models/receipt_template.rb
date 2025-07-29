# == Schema Information
#
# Table name: document_templates
#
#  id                  :bigint           not null, primary key
#  content             :text
#  default             :boolean          default(FALSE)
#  description         :text
#  name                :string           not null
#  transaction_type_cd :integer
#  type                :string
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  account_id          :bigint           not null
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

    ReceiptTemplate.transaction do
      receipt_template = account.receipt_templates.new(name: "Recebimento Padrão", default: true, transaction_type_cd: 0, content: '<h2 class="min-h-[1rem] print:leading-6 print:scale-[1.7] print:mx-44 print:font-sans" style="text-align: center">Recibo</h2><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans">Eu, [MINHA_EMPRESA], CPF/CNPJ: [MINHA_EMPRESA_DOCUMENTO], declaro que recebi de [NOME_CLIENTE], inscrita no CPF/CNPJ: [DOCUMENTO_CLIENTE], a importância supra de [VALOR_ITEM], referente a [DESCRICAO_ITEM]. E para clareza, afirmo o presente.</p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans">[MINHA_EMPRESA_CIDADE]/[MINHA_EMPRESA_ESTADO],</p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans">[DATA_ATUAL].</p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans" style="text-align: center">&nbsp;____________________________________________________________________<br>Nome: [MINHA_EMPRESA], CPF/CNPJ: [MINHA_EMPRESA_DOCUMENTO]&nbsp;&nbsp;</p>')
      receipt_template.settings(:receipt).header = true
      receipt_template.save

      receipt_template = account.receipt_templates.new(name: "Despesa Padrão", default: true, transaction_type_cd: 1, content: '<h2 class="min-h-[1rem] print:leading-6 print:scale-[1.7] print:mx-44 print:font-sans" style="text-align: center">Recibo</h2><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans">Eu, [NOME_CLIENTE], CPF/CNPJ: [DOCUMENTO_CLIENTE], declaro que recebi de [MINHA_EMPRESA], inscrita no CPF/CNPJ: [MINHA_EMPRESA_DOCUMENTO], a importância supra de [VALOR_ITEM], referente a [DESCRICAO_ITEM]. E para clareza, afirmo o presente.</p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans">[MINHA_EMPRESA_CIDADE]/[MINHA_EMPRESA_ESTADO],</p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans">[DATA_ATUAL].</p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans" style="text-align: center">&nbsp;____________________________________________________________________<br>Nome: [MINHA_EMPRESA], CPF/CNPJ: [MINHA_EMPRESA_DOCUMENTO]&nbsp;&nbsp;</p>')
      receipt_template.settings(:receipt).header = true
      receipt_template.save

      receipt_template = account.receipt_templates.new(name: "Recibo de Adiantamento de Salário", default: true, transaction_type_cd: 1, content: '<h2 class="min-h-[1rem] print:leading-6 print:scale-[1.7] print:mx-[200px] print:font-sans" style="text-align: center">RECIBO DE ADIANTAMENTO DE SALÁRIO </h2><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans" style="text-align: center"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans" style="text-align: center">Recebi de [MINHA_EMPRESA](empregador), a quantia de [VALOR_ITEM], correspondente a adiantamento de salário do mês de [MES_ATUAL], a ser descontado no próximo pagamento, e para clareza firmamos o presente na cidade de [MINHA_EMPRESA_CIDADE], [MINHA_EMPRESA_ESTADO] no dia [DATA_ATUAL].</p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans" style="text-align: center"> </p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans" style="text-align: center"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans" style="text-align: center"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans" style="text-align: center"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans" style="text-align: center"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans" style="text-align: center">_________________________________________ </p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans" style="text-align: center">[NOME_CLIENTE](empregado)</p>')
      receipt_template.settings(:receipt).header = true
      receipt_template.save
    end

  end
end
