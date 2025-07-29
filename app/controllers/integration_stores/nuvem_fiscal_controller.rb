# frozen_string_literal: true

module IntegrationStores
  class NuvemFiscalController < IntegrationStoresController
    include Wicked::Wizard
    steps(*%i[welcome company nfse_config certificate done])

    # GET /integration_stores/1 or /integration_stores/1.json
    def show
      case step
      when :company
        @company = @integration_store.account.company
      when :nfse_config, :certificate
        @nfse_config = @integration_store.account.company.nfse_config.presence || @integration_store.account.company.build_nfse_config
      else
        @nfse_config = @integration_store.account.company.nfse_config
      end
      render_wizard
    end

    # GET /integration_stores/new
    def new; end

    # GET /integration_stores/1/edit
    def edit; end

    # POST /integration_stores or /integration_stores.json
    def create
      @integration_store = IntegrationStores::NuvemFiscal.nuvem_fiscal_account_store(Current.account.id)
      @integration_store.state = steps.first
      if @integration_store.save
        redirect_to wizard_path(steps.first, integration_store_id: @integration_store.id)
      else
        render :new, status: :unprocessable_entity
      end
    end

    # PATCH/PUT /integration_stores/1 or /integration_stores/1.json
    def update
      company = @integration_store.account.company

      case step
      when :company
        result = IntegrationStores::NuvensFiscais::ConfigureCompany.call(company:, company_params:)
      when :nfse_config
        result = IntegrationStores::NuvensFiscais::ConfigureNfse.call(company:, nfse_config_params:)
      when :certificate
        if certificate_params[:a1_cert_file].present? && certificate_params[:a1_cert_password].present?
          result = IntegrationStores::NuvensFiscais::ConfigureCertificate.call(company:, certificate_params:)
          @integration_store.integrated_at = Time.zone.now
        end
      end

      if result&.failure?
        return redirect_to(
          wizard_path(step, integration_store_id: @integration_store.id),
          alert: result.error
        )
      end

      @integration_store.state = step
      if @integration_store.save
        return redirect_to integration_stores_path, notice: t('.success') if @integration_store.state == steps.last
      end

      render_wizard(@integration_store)
    end

    # DELETE /integration_stores/1 or /integration_stores/1.json
    def destroy
      @integration_store.discard!
      respond_to do |format|
        notice = t('.success')
        format.html { redirect_to integration_stores_url, notice: }
        format.json { head :no_content }
        format.turbo_stream { flash.now.notice = notice }
      end
    end

    private

    # def set_integration_store
    #   @integration_store = IntegrationStores::NuvemFiscal.find(params[:integration_store_id])
    # end

    def address_params
      params.require(:address).permit(:ibge_city_code)
    end

    def company_params
      params.require(:company).permit(
        :name, :screen_name, :document_1, :document_2,
        :document_3, :email, :phone_number,
        {
          addresses_attributes: {}
        }
      )
    end

    def nfse_config_params
      params.require(:company_nfse_config).permit(
        %i[id enabled provider environment simplified_tax_system tax_calculation_regime special_tax_regime
           rps_initial_batch_number rps_series rps_initial_number tax_incentive service_description national_tax_code
           municipal_tax_code iss_service_provided_tax iss_withholding_type iss_tax_rate]
      )
    end

    def certificate_params
      params.require(:company_nfse_config).permit(%i[a1_cert_file a1_cert_password])
    end
  end
end
