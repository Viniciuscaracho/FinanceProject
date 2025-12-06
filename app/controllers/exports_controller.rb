# frozen_string_literal: true

class ExportsController < ApplicationController
  before_action :set_current_period,              only: %i[new index create]
  before_action :set_current_bank_account_ids,    only: %i[new index create]
  before_action :set_current_cost_center_ids,     only: %i[new index create]
  before_action :set_current_paid_values,         only: %i[new index create]

  def index
    authorize! :read, :exports

    @records = current_account.exports.order(created_at: :desc)

    @records.load

    respond_to do |format|
      format.html
    end
  end

  def new

    @records = current_account.exports.order(created_at: :desc)

    @records.load

    respond_to do |format|
      format.html
    end
  end

  def create
    respond_to do |format|
      if current_account.exports.exists?(state_cd: [0, 3])
        flash.now.alert = t('.wait_pending_export')
        format.turbo_stream
        return
      end


      @export = current_account.exports.new(
        source: :backup_xlsx,
        params: {
          start_date: @current_start_date,
          end_date: @current_end_date,
          bank_account_ids: @current_bank_account_ids,
          cost_center_ids: @current_cost_center_ids,
          paid_values: @current_paid_values
        }
      )

      @export.progress_number = 0
      @export.state = :waiting
      @export.progress_total = 0
      @export.progress_number = 0


      if @export.save
        flash.now.notice = t('.success')
        format.json { render :show, status: :created, location: @import }
        format.turbo_stream
      else
        flash.now.alert = t('.error')
        format.json { render json: @import.errors, status: :unprocessable_entity }
        format.turbo_stream
      end
    end

  end

  def destroy
    authorize! :destroy, :exports

    @export = current_account.exports.find(params[:id])

    @export.destroy

    respond_to do |format|
      format.html { redirect_to exports_url, notice: t('.success') }
      format.turbo_stream
      format.json { head :no_content }
    end
  end

  def contacts_xlsx
    current_account.exported_file.attach(
      io: Exports::ContactsXlsx.call(account: Current.account).data,
      filename: contact_xlsx_filename,
      content_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

    @exported_file = current_account.exported_file

    respond_to do |format|
      format.turbo_stream
    end
  end

  private

  def backup_xlsx_filename
    base = "Backup-BarberManagement-#{I18n.l(Time.zone.now)}"
    "#{base}.xlsx"
  end

  def contact_xlsx_filename
    base = "#{I18n.t('exports.contacts.title')}-BarberManagement-#{I18n.l(Time.zone.now)}"
    "#{base}.xlsx"
  end

  def set_current_period
    transactions = current_account.transactions.order(:due_date)

    start_date = params[:start_date]
    end_date = params[:end_date]

    start_date = parse_date(start_date) if start_date.present?
    end_date = parse_date(end_date) if end_date.present?

    @current_start_date = start_date.presence || transactions.first&.due_date.presence || Date.current.beginning_of_month

    @current_end_date = end_date.presence || transactions.last&.due_date.presence || Date.current.end_of_month
  end

  def set_current_bank_account_ids
    @current_bank_account_ids = params.fetch(:bank_account_id, [])
  end

  def set_current_cost_center_ids
    @current_cost_center_ids = params.fetch(:cost_center_id, [])
  end

  def set_current_paid_values
    @current_paid_values = params.fetch(:paid, %w[true false])
  end

  # Only allow a list of trusted parameters through.
  def export_params
    params.fetch(:export, {})
  end
end
