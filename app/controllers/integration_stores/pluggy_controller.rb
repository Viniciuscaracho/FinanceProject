# frozen_string_literal: true

module IntegrationStores
  class PluggyController < IntegrationStoresController
    include Wicked::Wizard
    steps %i[welcome connect_token done]

    # GET /integration_stores/1 or /integration_stores/1.json
    def show; end

    # GET /integration_stores/new
    def new
      @integration_store = IntegrationStores::Pluggy.new
    end

    # GET /integration_stores/1/edit
    def edit; end

    # POST /integration_stores or /integration_stores.json
    def create
      @integration_store = IntegrationStores::Pluggy.pluggy_account_store(Current.account.id)
      if @integration_store.save
        redirect_to wizard_path(steps.first, id: @integration_store.id)
      else
        render :new, status: :unprocessable_entity
      end
    end

    # PATCH/PUT /integration_stores/1 or /integration_stores/1.json
    def update
      if @integration_store.update(integration_store_params)
        notice = t('.success')
        format.html { redirect_to integration_stores_url, notice: }
        format.json { render :show, status: :ok, location: @integration_store }
        format.turbo_stream { flash.now.notice = notice }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @integration_store.errors, status: :unprocessable_entity }
      end
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
  end
end
