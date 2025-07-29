# frozen_string_literal: true

class ServicesController < ApplicationController
  before_action :set_service, only: %i[show edit update destroy]
  before_action :set_cnaes, only: %i[new edit duplicate]
  before_action :set_national_service_codes, only: %i[new edit duplicate]
  before_action :set_nbs_codes, only: %i[new edit duplicate]

  # GET /services
  def index
    query = Current.account.services.order(name: :asc)
    query = query.search_by_q(params[:q]) if params[:q].present?

    @pagy, @records = pagy(query)
    @records.load
  end

  def autocomplete
    query = Current.account.services.order(name: :asc)
    query = query.search_by_q(params[:q]) if params[:q].present?
    if params[:service_type].present?
      query = case params[:service_type]
              when 'provided'
                query.provideds
              when 'consumed'
                query.consumeds
              else
                query.provided_and_consumed
              end
    end

    @pagy, @records = pagy(query)
    @records.load

    render layout: false
  end

  # GET /services/1 or /services/1.json
  def show; end

  # GET /services/new
  def new
    @service = Service.new
    # if Flipper.enabled?(:nfse, Current.account)
  end

  # GET /services/1/edit
  def edit
    # if Flipper.enabled?(:nfse, Current.account) && @service.nfse_config.blank?
  end

  def duplicate
    service = Current.account.services.find(params[:id])

    @service = service.dup
    @service.name = "#{service.name} (#{t('shared.duplicated')})"
    @service.internal_code = nil
    @service.nfse_config = service.nfse_config.dup if service.nfse_config.present?

    render :new
  end

  # POST /services or /services.json
  def create
    @service = Current.account.services.new(service_params)

    respond_to do |format|
      if @service.save
        notice = t('.success')
        format.html { redirect_to services_url, notice: }
        format.json { render :show, status: :created, location: @service }
        format.turbo_stream { flash.now.notice = notice }
      else
        set_cnaes
        set_national_service_codes
        set_nbs_codes
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @service.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /services/1 or /services/1.json
  def update
    respond_to do |format|
      if @service.update(service_params)
        notice = t('.success')
        format.html { redirect_to services_url, notice: }
        format.json { render :show, status: :ok, location: @service }
        format.turbo_stream { flash.now.notice = notice }
      else
        set_cnaes
        set_national_service_codes
        set_nbs_codes
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @service.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /services/1 or /services/1.json
  def destroy
    @service.discard!
    respond_to do |format|
      notice = t('.success')
      format.html { redirect_to services_url, notice: }
      format.json { head :no_content }
      format.turbo_stream { flash.now.notice = notice }
    end
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_service
    @service = Current.account.services.find(params[:id])
  end

  def set_cnaes
    @cnaes = Current.account.company.grouped_cnaes
  end

  def set_national_service_codes
    @national_service_codes = NationalServiceCode.order(key: :asc)
  end

  def set_nbs_codes
    @nbs_codes = NbsCode.order(key: :asc)
  end

  # Only allow a list of trusted parameters through.
  def service_params
    permitted_params = :internal_code, :name, :description, :unit, :cost_price_cents, :selling_price_cents, :service_type

    if Flipper.enabled?(:nfse, Current.account)
      nfse_config_attributes = %i[id cnae_code national_tax_code municipal_tax_code city_code country_code nbs_code
                                  iss_service_provided_tax iss_country_code iss_city_code iss_immunity_type
                                  iss_withholding_type iss_tax_rate cst_code pis_tax_rate cofins_tax_rate
                                  pis_cofins_withholding_type]
      permitted_params << { nfse_config_attributes: }
    end

    params.require(:service).permit(permitted_params)
  end
end
