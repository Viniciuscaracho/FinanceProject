# frozen_string_literal: true

class InvoicesController < ApplicationController
  before_action :set_current_period, only: %i[index totalizer filter]
  before_action :se_current_bank_account_ids, only: %i[index totalizer filter]
  before_action :set_current_contact_ids, only: %i[index totalizer filter]
  before_action :set_current_statuses, only: %i[index totalizer filter]
  before_action :set_invoice, only: %i[show preview edit update destroy duplicate invoice_actions]

  # GET /invoices
  def index
    filter
  end

  def filter
    authorize! :read, Invoice

    query = Invoices::Search.call(
      account: Current.account,
      current_period: @current_period,
      current_bank_account_ids: @current_bank_account_ids,
      current_contact_ids: @current_contact_ids,
      current_statuses: @current_statuses,
      q: params.fetch(:q, nil)
    ).query

    sort      = sort_column(Invoice, default: 'number')
    direction = sort_direction(default: 'desc')
    query     = query.order(sort => direction)

    @pagy, @records = pagy(query)
    @records.load

    render layout: false if request.xhr? || turbo_frame_request?
  end

  def totalizer
    @totalizer = Invoices::Totalize.call(
      account: Current.account,
      current_period: @current_period,
      current_bank_account_ids: @current_bank_account_ids,
      current_contact_ids: @current_contact_ids,
      current_statuses: @current_statuses,
      q: params.fetch(:q, nil)
    ).query

    render partial: 'totalizer', locals: { totalizer: @totalizer }
  end

  def preview
    authorize! :read, Invoice

    Current.account.invoice_templates.create_default_invoice_template if Current.account.invoice_templates.empty?

    @invoice_template = if params[:invoice_template_id].present?
                          Current.account.invoice_templates.find(params[:invoice_template_id])
                        else
                          Current.account.invoice_templates.first
                        end
  end

  # GET /invoices/1 or /invoices/1.json
  def show
    authorize! :read, Invoice
    @invoice_template = Current.account.invoice_templates.find_by(id: params[:invoice_template_id])
    respond_to do |format|
      format.html
      format.pdf do
        result = PdfBuilder.call(html: render_to_string, base_url: request.base_url, protocol: request.protocol)
        if result.success?
          send_data(result.pdf, {
                      filename: "#{Invoice.model_name.human} #{@invoice.number} - #{@invoice.recipient.name.titleize.unaccent}.pdf",
                      type: 'application/pdf',
                      disposition: params.fetch(:disposition, 'inline')
                    })
        else
          head :no_content
        end
      end
    end
  end

  def invoice_actions
    render partial: 'invoice_actions', locals: { invoice: @invoice }
  end

  # GET /invoices/new
  def new
    authorize! :create, Invoice

    default_tax_percentage = Current.account.invoice_tax_percentage || 0
    default_tax_already_applied = Current.account.invoice_tax_already_applied || true

    if params[:transaction_id].present?
      record = Current.account.transactions.find(params[:transaction_id])
      @invoice = Invoice.new(
        account: Current.account,
        record:,
        issue_date: Date.current,
        bank_account: record.bank_account,
        due_date: record.due_date,
        recipient: record.contact,
        tax_percentage: default_tax_percentage,
        tax_already_applied: default_tax_already_applied,
        status: record.paid? ? :paid : :draft
      )
      @invoice.lines.build(description: record.name, quantity: 1, unit_price: record.exchanged_amount)
      @invoice.calculate_all
    else
      due_date = Current.account.invoice_due_days&.days&.from_now || nil
      @invoice = Invoice.new(
        account: Current.account,
        issue_date: Date.current,
        due_date:,
        recipient: Contact.new,
        tax_percentage: default_tax_percentage,
        tax_already_applied: default_tax_already_applied
      )
      @invoice.lines.build
    end
  end

  def send_to_recipient; end

  # GET /invoices/1/edit
  def edit
    authorize! :update, Invoice
  end

  # POST /invoices or /invoices.json
  def create
    authorize! :create, Invoice

    if params[:add_line].present?
      @invoice = Invoice.new(invoice_params)
      @invoice.lines.build
    elsif params[:remove_line].present?
      @invoice = Invoice.new(invoice_params)
      @invoice.lines[params[:remove_line].to_i].mark_for_destruction
      @invoice.calculate_all
    elsif params[:commit].present?
      result = Invoices::Create.call(account: Current.account, invoice_params:, action: params[:commit])
      @invoice = result.invoice

      respond_to do |format|
        if result.success?
          notice = t('.success')
          format.html { redirect_to invoices_url, notice: }
          format.json { render :show, status: :created, location: @invoice }
          format.turbo_stream { flash.now.notice = notice }
        else
          format.html { render :new, status: :unprocessable_entity }
          format.json { render json: @invoice.errors, status: :unprocessable_entity }
        end
      end
    else
      @invoice = Invoice.new(invoice_params)
      @invoice.calculate_all
    end
  end

  # PATCH/PUT /invoices/1 or /invoices/1.json
  def update
    authorize! :update, Invoice

    if params[:add_line].present?
      @invoice.assign_attributes(invoice_params)
      @invoice.lines.build
    elsif params[:remove_line].present?
      @invoice.assign_attributes(invoice_params)
      @invoice.lines[params[:remove_line].to_i].mark_for_destruction
      @invoice.calculate_all
    elsif params[:commit].present?
      respond_to do |format|
        result = Invoices::Update.call(invoice: @invoice, invoice_params:, action: params[:commit])
        if result.success?
          notice = t('.success')
          format.html { redirect_to invoices_url, notice: }
          format.json { render :show, status: :ok, location: @invoice }
          format.turbo_stream { flash.now.notice = notice }
        else
          format.html { render :edit, status: :unprocessable_entity }
          format.json { render json: @invoice.errors, status: :unprocessable_entity }
        end
      end
    else
      @invoice.assign_attributes(invoice_params)
      @invoice.calculate_all
    end
  end

  # DELETE /invoices/1 or /invoices/1.json
  def destroy
    authorize! :destroy, Invoice

    Invoices::Destroy.call(invoice: @invoice)
    respond_to do |format|
      notice = t('.success')
      format.html { redirect_to invoices_url, notice: }
      format.json { head :no_content }
      format.turbo_stream { flash.now.notice = notice }
    end
  end

  def duplicate
    authorize! :create, Invoice

    result = Invoices::Duplicate.call(invoice: @invoice)
    @invoice = result.duplicated_invoice
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_invoice
    @invoice = Current.account.invoices.find(params[:id])
  end

  # Only allow a list of trusted parameters through.
  def invoice_params
    lines_attributes = %i[id _destroy marked_for_destruction offer_id description quantity unit_price_cents
                          total_price_cents]
    recipient_attributes = [
      :id, :document_1, :name, :document_2, :email, :phone_number, :cell_phone_number, :birth_date, { addresses_attributes: {} }
    ]

    params.require(:invoice).permit(
      :status, :number, :placed_at, :issue_date, :due_date, :recipient_id, :bank_account_id, :description,
      :amount_cents, :subtotal_cents, :total_cents, :sync_with_transaction, :discount_description,
      :discount_percentage, :tax_description, :tax_percentage, :tax_already_applied, :record_type, :record_id,
      { append_attachments: [], attachments: [] },
      { recipient_attributes: },
      { lines_attributes: }
    )
  end

  def search_params
    params.permit(:q, :page, :start_date, :end_date, { bank_account_ids: [] }, { contact_ids: [] }, { statuses: [] })
  end

  def set_current_period
    if search_params[:start_date].present? && search_params[:end_date].present?
      @start_date = Date.strptime(search_params[:start_date].to_s, t('date.formats.default'))
      @end_date = Date.strptime(search_params[:end_date].to_s, t('date.formats.default'))
    elsif search_params[:start_date].present?
      @start_date = Date.strptime(search_params[:start_date].to_s, t('date.formats.default'))
      @end_date = Date.current.end_of_month
    elsif search_params[:end_date].present?
      @start_date = Date.current.beginning_of_month
      @end_date = Date.strptime(search_params[:end_date].to_s, t('date.formats.default'))
    else
      @start_date = Date.current.beginning_of_month
      @end_date = Date.current.end_of_month
    end

    @current_period = @start_date..@end_date
  end

  def se_current_bank_account_ids
    if search_params[:bank_account_ids]&.reject(&:blank?).present?
      @current_bank_account_ids = Current.account.bank_accounts.find(search_params[:bank_account_ids]&.reject(&:blank?)).pluck(:id)
    else
      @current_bank_account_ids = []
    end
  end

  def set_current_contact_ids
    @current_contact_ids = if search_params[:contact_ids]&.reject(&:blank?).present?
                             Current.account.contacts.find(search_params[:contact_ids]&.reject(&:blank?)).pluck(:id)
                           else
                             []
                           end
  end

  def set_current_statuses
    @current_statuses = search_params[:statuses]&.reject(&:blank?).presence || []
  end
end
