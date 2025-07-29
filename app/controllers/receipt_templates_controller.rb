# frozen_string_literal: true

class ReceiptTemplatesController < ApplicationController
  before_action :set_current_account
  before_action :receipt_template_params
  before_action :set_receipt_template, only: %i[show edit update destroy reset_default]

  # GET /receipt_templates
  def index
    authorize! :read, DocumentTemplate

    query = Current.account.receipt_templates
    query = query.sort_by_params(sort_column(DocumentTemplate, default: :name), sort_direction)
    query = query.search_by_q(params[:q]) if params[:q].present?

    @pagy, @records = pagy(query)

    @records.load

    render partial: 'index'
  end

  # GET /receipt_templates/1 or /receipt_templates/1.json
  def show; end

  # GET /receipt_templates/new
  def new
    authorize! :create, ReceiptTemplate
    @receipt_template = ReceiptTemplate.new
  end

  # GET /receipt_templates/1/edit
  def edit
    authorize! :update, ReceiptTemplate
  end

  # POST /receipt_templates or /receipt_templates.json
  def create
    authorize! :create, ReceiptTemplate
    receipt_template = receipt_template_params
    receipt_template['transaction_type'] = receipt_template['transaction_type'].to_i

    @receipt_template = current_account.receipt_templates.new(receipt_template)
    @receipt_template.settings(:receipt).header = !params[:show_header].nil?

    respond_to do |format|
      if @receipt_template.save
        notice = t('.success')
        format.html { redirect_to document_templates_url, notice: }
        format.json { render :show, status: :created, location: @receipt_template }
        format.turbo_stream { flash.now.notice = notice }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @receipt_template.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /receipt_templates/1 or /receipt_templates/1.json
  def update
    authorize! :update, ReceiptTemplate

    receipt_template = receipt_template_params
    receipt_template['transaction_type'] = receipt_template['transaction_type'].to_i
    @receipt_template.settings(:receipt).header = !params[:show_header].nil?

    respond_to do |format|
      if @receipt_template.update(receipt_template)
        notice = t('.success')
        format.html { redirect_to document_templates_url, notice: }
        format.json { render :show, status: :ok, location: @receipt_template }
        format.turbo_stream { flash.now.notice = notice }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @receipt_template.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /receipt_templates/1 or /receipt_templates/1.json
  def destroy
    @receipt_template.destroy
    respond_to do |format|
      notice = t('.success')
      format.html { redirect_back_or_to document_templates_url, notice: }
      format.json { head :no_content }
      format.turbo_stream { flash.now.notice = notice }
    end
  end

  def variable
    @variables = {
      '[DATA_ATUAL]' => 'Data de emissão do recibo',
      '[MEU_NOME]' => 'Nome do usuário logado no momento da emissão',
      '[MINHA_EMPRESA]' => 'Nome da minha empresa/negócio',
      '[MINHA_EMPRESA_DOCUMENTO]' => 'Número do documento da minha empresa/negócio',
      '[MINHA_EMPRESA_ESTADO]' => 'Estado da minha empresa/negócio',
      '[MINHA_EMPRESA_CIDADE]' => 'Cidade da minha empresa/negócio',
      '[CODIGO_ITEM]' => 'Código único da movimentação, gerado pelo sistema',
      '[CONTA_BANCARIA_ITEM]' => 'Nome da conta bancária da movimentação',
      '[DATA_ITEM]' => 'Data da movimentação que será emitido o recibo',
      '[VALOR_ITEM]' => 'Valor da movimentação que será emitido o recibo',
      '[NUMERO_DOCUMENTO_ITEM]' => 'Número do documento da movimentação',
      '[FORMA_PAGAMENTO_ITEM]' => 'Forma de pagamento da movimentação',
      '[DESCRICAO_ITEM]' => 'Descrição da movimentação que será emitido o recibo',
      '[DETALHES_ITEM]' => 'Descrição da movimentação que será emitido o recibo',
      '[CATEGORIA_ITEM]' => 'Categoria da movimentação que será emitido o recibo',
      '[NOME_CLIENTE]' => 'Nome do Cliente da movimentação que será emitido o recibo',
      '[DOCUMENTO_CLIENTE]' => 'CNPJ ou CPF do cliente dependendo do tipo dele',
      '[TELEFONE_CLIENTE]' => 'Telefone do Cliente da movimentação que será emitido o recibo',
      '[EMAIL_CLIENTE]' => 'Email do Cliente da movimentação que será emitido o recibo',
      '[DESCRICAO_CLIENTE]' => 'Descrição do Contato do Cliente da movimentação que será emitido o recibo',
      '[ENDERECO_COMPLETO_CLIENTE]' => 'Endereço completo do Cliente da movimentação que será emitido o recibo',
      '[ENDERECO_SIMPLIFICADO_CLENTE]' => 'Endereço simplificado do Cliente da movimentação que será emitido o recibo',
      '[COMP_ENDERECO_CLIENTE]' => 'Complemento do Endereço do Cliente da movimentação que será emitido o recibo',
      '[BAIRRO_ENDERECO_CLIENTE]' => 'Bairro do Endereço do Cliente da movimentação que será emitido o recibo',
      '[CEP_ENDERECO_CLIENTE]' => 'CEP do Endereço do Cliente da movimentação que será emitido o recibo',
      '[ESTADO_ENDERECO_CLIENTE]' => 'UF do Endereço do Cliente da movimentação que será emitido o recibo',
      '[CIDADE_ENDERECO_CLIENTE]' => 'Cidade do Endereço do Cliente da movimentação que será emitido o recibo'
    }
  end

  def reset_default
    if @receipt_template.default
      case @receipt_template.name
      when 'Recebimento Padrão'
        @receipt_template.update(content: '<h2 class="min-h-[1rem] print:leading-6 print:scale-[1.7] print:mx-44 print:font-sans" style="text-align: center">Recibo</h2><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans">Eu, [MINHA_EMPRESA], CPF/CNPJ: [MINHA_EMPRESA_DOCUMENTO], declaro que recebi de [NOME_CLIENTE], inscrita no CPF/CNPJ: [DOCUMENTO_CLIENTE], a importância supra de [VALOR_ITEM], referente a [DESCRICAO_ITEM]. E para clareza, afirmo o presente.</p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans">[MINHA_EMPRESA_CIDADE]/[MINHA_EMPRESA_ESTADO],</p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans">[DATA_ATUAL].</p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans" style="text-align: center">&nbsp;____________________________________________________________________<br>Nome: [MINHA_EMPRESA], CPF/CNPJ: [MINHA_EMPRESA_DOCUMENTO]&nbsp;&nbsp;</p>')
      when 'Despesa Padrão'
        @receipt_template.update(content: '<h2 class="min-h-[1rem] print:leading-6 print:scale-[1.7] print:mx-[200px] print:font-sans" style="text-align: center">Recibo</h2><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans">Eu, [NOME_CLIENTE], CPF/CNPJ: [DOCUMENTO_CLIENTE], declaro que recebi de [MINHA_EMPRESA], inscrita no CPF/CNPJ: [MINHA_EMPRESA_DOCUMENTO], a importância supra de [VALOR_ITEM], referente a [DESCRICAO_ITEM]. E para clareza, afirmo o presente.</p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans">[MINHA_EMPRESA_CIDADE]/[MINHA_EMPRESA_ESTADO],</p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans">[DATA_ATUAL].</p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans" style="text-align: center">&nbsp;____________________________________________________________________<br>Nome: [NOME_CLIENTE], CPF/CNPJ: [DOCUMENTO_CLIENTE]&nbsp;&nbsp;</p>')
      when 'Recibo de Adiantamento de Salário'
        @receipt_template.update(content: '<h2 class="min-h-[1rem] print:leading-6 print:scale-[1.7] print:mx-[200px] print:font-sans" style="text-align: center">RECIBO DE ADIANTAMENTO DE SALÁRIO </h2><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans" style="text-align: center"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans" style="text-align: center">Recebi de [MINHA_EMPRESA](empregador), a quantia de [VALOR_ITEM], correspondente a adiantamento de salário do mês de [MES_ATUAL], a ser descontado no próximo pagamento, e para clareza firmamos o presente na cidade de [MINHA_EMPRESA_CIDADE], [MINHA_EMPRESA_ESTADO] no dia [DATA_ATUAL].</p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans" style="text-align: center"> </p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans" style="text-align: center"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans" style="text-align: center"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans" style="text-align: center"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans" style="text-align: center"></p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans" style="text-align: center">_________________________________________ </p><p class="min-h-[1rem] text-xs print:min-h-[2rem] print:leading-6 print:text-xl print:font-sans" style="text-align: center">[NOME_CLIENTE](empregado)</p>')

      end
    end
  end

  private

  def set_current_account
    @current_account = Current.account
  end

  # Use callbacks to share common setup or constraints between actions.
  def set_receipt_template
    @receipt_template = current_account.receipt_templates.find(params[:id])
  end

  # Only allow a list of trusted parameters through.
  def receipt_template_params
    params.fetch(:receipt_template, {}).permit(:name, :description, :transaction_type, :content, :header)
  end
end
