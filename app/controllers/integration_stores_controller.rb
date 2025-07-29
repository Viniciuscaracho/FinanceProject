# frozen_string_literal: true

class IntegrationStoresController < ApplicationController
  before_action :set_integration_store, only: %i[show edit update destroy]

  # GET /integration_stores
  def index
    query = IntegrationStore.globals.order(name: :asc)
    query = query.search_by_q(params[:q]) if params[:q].present?

    @pagy, @records = pagy(query)
    @records.load
  end
  #
  # # GET /integration_stores/1 or /integration_stores/1.json
  # def show; end

  # GET /integration_stores/new
  def new
    @integration_store = IntegrationStore.new
  end

  # GET /integration_stores/1/edit
  def edit; end

  # POST /integration_stores or /integration_stores.json
  def create
    @integration_store = case params[:integration_store][:store_type].to_sym
                         when :invoicing
                           IntegrationStores::NuvemFiscal.nuvem_fiscal_account_store(Current.account.id)
                         when :open_banking
                           IntegrationStores::Pluggy.pluggy_account_store(Current.account.id)
                         end

    if @integration_store.save
      redirect_to wizard_path(steps.first, id: @integration_store.id)
    else
      render :new, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /integration_stores/1 or /integration_stores/1.json
  # def update
  #   if @integration_store.update(integration_store_params)
  #     notice = t('.success')
  #     format.html { redirect_to integration_stores_url, notice: }
  #     format.json { render :show, status: :ok, location: @integration_store }
  #     format.turbo_stream { flash.now.notice = notice }
  #   else
  #     format.html { render :edit, status: :unprocessable_entity }
  #     format.json { render json: @integration_store.errors, status: :unprocessable_entity }
  #   end
  # end

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

  protected

  # Use callbacks to share common setup or constraints between actions.
  def set_integration_store
    @integration_store = Current.account.integration_stores.find(params[:integration_store_id])
  end

  # Only allow a list of trusted parameters through.
  # def create_integration_store_params
  #   params.require(:integration_store).permit :name, :store_type
  # end
end
