# frozen_string_literal: true

class InvoiceTemplatesController < ApplicationController
  before_action :set_invoice_template, only: %i[show edit update destroy preview]

  # GET /invoice_templates
  def index
    authorize! :read, DocumentTemplate

    create_default_invoice_template

    query = Current.account.invoice_templates
    query = query.sort_by_params(sort_column(DocumentTemplate, default: :name), sort_direction)
    query = query.search_by_q(params[:q]) if params[:q].present?

    @pagy, @records = pagy(query)

    @records.load

    render partial: 'index'
  end

  # GET /invoice_templates/new
  def new
    authorize! :create, InvoiceTemplate
    @invoice_template = InvoiceTemplate.new
    set_fake_invoice
  end

  def edit
    authorize! :update, InvoiceTemplate
    set_fake_invoice
  end

  def preview
    authorize! :read, InvoiceTemplate
    set_fake_invoice
    render layout: false
  end

  # POST /invoice_templates or /invoice_templates.json
  def create
    authorize! :create, InvoiceTemplate
    @invoice_template = Current.account.invoice_templates.new(invoice_template_params)

    respond_to do |format|
      if @invoice_template.save
        notice = t('.success')
        format.html { redirect_to document_templates_url(document_type: 'InvoiceTemplate'), notice: }
        format.json { render :show, status: :created, location: @invoice_template }
        format.turbo_stream { flash.now.notice = notice }
      else
        set_fake_invoice
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @invoice_template.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /invoice_templates/1 or /invoice_templates/1.json
  def update
    authorize! :update, InvoiceTemplate
    respond_to do |format|
      if @invoice_template.update(invoice_template_params)
        notice = t('.success')
        format.html { redirect_to document_templates_url(document_type: 'InvoiceTemplate'), notice: }
        format.json { render :show, status: :ok, location: @invoice_template }
        format.turbo_stream { flash.now.notice = notice }
      else
        set_fake_invoice
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @invoice_template.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /invoice_templates/1 or /invoice_templates/1.json
  def destroy
    authorize! :destroy, DocumentTemplate
    @invoice_template.destroy
    respond_to do |format|
      notice = t('.success')
      format.html { redirect_to document_templates_url(document_type: 'InvoiceTemplate'), notice: }
      format.json { head :no_content }
      format.turbo_stream { flash.now.notice = notice }
    end
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_invoice_template
    @invoice_template = Current.account.invoice_templates.find(params[:id])
  end

  def sort_direction(default: 'asc')
    params[:direction].presence_in(%w[asc desc]) || default.to_s
  end

  # Only allow a list of trusted parameters through.
  def invoice_template_params
    params.require(:invoice_template).permit(
      :name, :description, :show_header, :show_header, :show_issue_date, :show_due_date,
      :show_recipient, :show_detailed_lines, :show_discount_info, :show_tax_info,
      :show_payment_info
    )
  end

  def set_fake_invoice
    recipient = Current.account.contacts.new(
      name: 'Nome do cliente',
      document_1: '123.456.789-00',
      email: 'contato@empresa.com',
      phone_number: '(11) 1234-5678',
      addresses_attributes: [
        {
          address_line1: 'Rua do cliente',
          address_line2: 'Complemento',
          district: 'Bairro',
          city: 'Cidade',
          state: 'UF',
          country: 'País',
          postcode: '12345-678'
        }
      ]
    )

    provider = Current.account.company.dup
    provider.assign_attributes(
      name: Current.account.company.name,
      document_1: Current.account.company.document_1.presence || '12.456.789/0001-12',
      email: Current.account.company.email.presence || 'contato@empresa.com',
      phone_number: Current.account.company.phone_number.presence || '(11) 1234-5678',
      addresses_attributes: [
        {
          address_line1: Current.account.company.addresses.first&.address_line1.presence || 'Rua da empresa',
          address_line2: Current.account.company.addresses.first&.address_line2.presence || 'Complemento',
          district: Current.account.company.addresses.first&.district.presence || 'Bairro',
          city: Current.account.company.addresses.first&.city.presence || 'Cidade',
          state: Current.account.company.addresses.first&.state.presence || 'UF',
          country: Current.account.company.addresses.first&.country.presence || 'País',
          postcode: Current.account.company.addresses.first&.postcode.presence || '12345-678'
        }
      ]
    )

    @invoice = Invoice.new(
      account: Current.account,
      number: 12_345_678,
      provider:,
      recipient:,
      issue_date: Date.current,
      due_date: Date.current + 15.days,
      lines_attributes: [
        { quantity: 40, unit_price_cents: 10_000, description: 'Descrição do item 1' },
        { quantity: 40, unit_price_cents: 10_000, description: 'Descrição do item 2' }
      ],
      discount_percentage: 10,
      discount_description: 'Descrição do desconto',
      tax_percentage: 14.5,
      tax_description: 'Descrição do imposto',
      description: 'O pagamento tem de ser feito dentro de 15 dias através de transferência bancária.\\r/\\nBanco: Nome do banco, Agencia: 123, Conta corrente: 12355-4'
    )
    @invoice.calculate_all
  end

  def create_default_invoice_template
    Current.account.invoice_templates.create_default_invoice_template if Current.account.invoice_templates.empty?
  end
end
