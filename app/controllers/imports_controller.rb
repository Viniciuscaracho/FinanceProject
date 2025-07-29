# frozen_string_literal: true

class ImportsController < ApplicationController
  before_action :set_import, only: %i[show edit update destroy discard undiscard]
  before_action :new_import, only: %i[new_xlsx_default new_xlsx_contacts]

  # GET /imports
  def index
    authorize! :read, Import

    query = current_account.imports.kept.order(created_at: :asc)
    query = query.search_by_q(params[:q]) if params[:q].present?

    @pagy, @records = pagy(query)

    @records.load
  end

  # GET /imports/1 or /imports/1.json
  def show
    authorize! :read, Import

    respond_to do |format|
      notice = I18n.t('imports.show.error')
      format.html { redirect_to imports_url, alert: notice }
      format.json { render json: @import.errors, status: :non_authoritative_information }
      format.turbo_stream { redirect_to imports_url, alert: notice }
    end
  end

  # GET /imports/new
  def new
    authorize! :create, Import

    @import = Import.new
  end

  # GET /imports/1/edit
  def edit; end

  # POST /imports or /imports.json
  def create
    authorize! :create, Import

    respond_to do |format|
      if current_account.imports.exists?(state_cd: [0, 3])
        flash.now.alert = t('.wait_pending_import')
        format.html { redirect_back_or_to imports_url }
        format.json { render :show, status: :created, location: @import }
        format.turbo_stream
        return
      end

      @import = current_account.imports.new(import_params)
      @import.state = :waiting
      @import.progress_total = 0
      @import.progress_number = 0

      if @import.save
        flash.now.notice = t('.success')
        format.html { redirect_back_or_to imports_url }
        format.json { render :show, status: :created, location: @import }
      else
        flash.now.alert = t('imports.create.fail_import')
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @import.errors, status: :unprocessable_entity }
      end

      format.turbo_stream
    end
  end

  # PATCH/PUT /imports/1 or /imports/1.json
  def update
    authorize! :update, Import

    respond_to do |format|
      notice = I18n.t('imports.update.error')
      format.html { redirect_to imports_url }
      format.json { render json: @import.errors, status: :unprocessable_entity }
      format.turbo_stream { redirect_to imports_url, alert: notice }
    end
  end

  # DELETE /imports/1 or /imports/1.json
  def destroy
    authorize! :destroy, @import

    @import.destroy
    respond_to do |format|
      notice = t('imports.destroy.success')
      format.html { redirect_to imports_url, alert: notice }
      format.turbo_stream { flash.now.notice = notice }
    end
  end

  def discard
    authorize! :discard, @import

    @import.discard
    respond_to do |format|
      notice = t('.success')
      format.html { redirect_to imports_url, alert: notice }
      format.turbo_stream { redirect_to imports_url, notice: }
    end
  end

  def undiscard
    authorize! :discard, @import

    @import.undiscard
    respond_to do |format|

      notice = t('.success')
      format.html { redirect_to imports_url, alert: notice }
      format.turbo_stream { redirect_to imports_url, notice: }
    end
  end

  def new_xlsx_default
    authorize! :create, Import
  end

  def new_xlsx_contacts
    authorize! :create, Import
  end

  def discarded_imports_modal
    @imports = Current.account.imports.discarded

  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_import
    @import = Current.account.imports.find(params[:id])
  end

  def new_import
    @import = Import.new
  end

  # Only allow a list of trusted parameters through.
  def import_params
    params.require(:import).permit(:source, :state, :file)
  end
end
