# frozen_string_literal: true

class DocumentTemplatesController < ApplicationController
  before_action :set_current_document_type
  before_action :set_current_template_url
  before_action :set_document_template, only: %i[edit update destroy]

  # GET /document_templates
  def index
    authorize! :read, DocumentTemplate
  end

  # GET /document_templates/new
  def new
    authorize! :create, DocumentTemplate
    @document_template = DocumentTemplate.new
  end

  def edit
    authorize! :update, DocumentTemplate
  end

  # POST /document_templates or /document_templates.json
  def create
    authorize! :create, DocumentTemplate
    @document_template = current_account.document_templates.new(document_template_params)

    respond_to do |format|
      if @document_template.save
        notice = t('.success')
        format.html { redirect_to document_templates_url, notice: }
        format.json { render :show, status: :created, location: @document_template }
        format.turbo_stream { flash.now.notice = notice }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @document_template.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /document_templates/1 or /document_templates/1.json
  def update
    authorize! :update, DocumentTemplate
    respond_to do |format|
      if @document_template.update(document_template_params)
        notice = t('.success')
        format.html { redirect_to document_templates_url, notice: }
        format.json { render :show, status: :ok, location: @document_template }
        format.turbo_stream { flash.now.notice = notice }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @document_template.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /document_templates/1 or /document_templates/1.json
  def destroy
    authorize! :destroy, DocumentTemplate

    respond_to do |format|
      if @document_template.destroy
        notice = t('.success')
        format.html { redirect_to document_templates_url, notice: }
        format.json { head :no_content }
        format.turbo_stream { flash.now.notice = notice }
      else
        error = t('being_used')
        format.html { render :index, status: :unprocessable_entity }
        format.json { render json: @document_template.errors, status: :unprocessable_entity }
        format.turbo_stream { flash.now.alert = error }
      end
    end
  end

  private

  # def current_authorized_document_templates
  #   DocumentTemplate.subclasses.each do |subclass|
  #     return subclass if Current.user.can?(:read, subclass)
  #   end
  # end

  # Use callbacks to share common setup or constraints between actions.
  def set_document_template
    @document_template = current_account.document_templates.find(params[:id])
  end

  def sort_direction(default: 'asc')
    params[:direction].presence_in(%w[asc desc]) || default.to_s
  end

  # Only allow a list of trusted parameters through.
  def document_template_params
    params.require(:document_template).permit(:name, :description, :type, :transaction_type_cd, :content, :account_id)
  end

  def set_current_document_type
    @current_document_type = params[:document_type]
                               .presence_in(%w[ReceiptTemplate InvoiceTemplate ContractTemplate]) || 'ReceiptTemplate'
  end

  def set_current_template_url
    @current_template_url = case @current_document_type
                            when 'ReceiptTemplate'
                              receipt_templates_url
                            when 'InvoiceTemplate'
                              invoice_templates_url
                            when 'ContractTemplate'
                              contract_templates_url
                            else
                              receipt_templates_url
                            end
  end
end
