# frozen_string_literal: true

class OffersController < ApplicationController
  before_action :set_offer, only: %i[show edit update destroy]

  # GET /offers
  def index
    query = current_account.offers.order(created_at: :asc)
    query = query.search_by_q(params[:q]) if params[:q].present?

    @pagy, @records = pagy(query)

    @records.load
  end

  # GET /offers/1 or /offers/1.json
  def show
  end

  # GET /offers/new
  def new
    @offer = Offer.new
  end

  # GET /offers/1/edit
  def edit
  end

  # POST /offers or /offers.json
  def create
    @offer = current_account.offers.new(offer_params)

    respond_to do |format|
      if @offer.save
        notice = t('.success')
        format.html { redirect_to offers_url, notice: notice }
        format.json { render :show, status: :created, location: @offer }
        format.turbo_stream { flash.now.notice = notice }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @offer.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /offers/1 or /offers/1.json
  def update
    respond_to do |format|
      if @offer.update(offer_params)
        notice = t('.success')
        format.html { redirect_to offers_url, notice: notice }
        format.json { render :show, status: :ok, location: @offer }
        format.turbo_stream { flash.now.notice = notice }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @offer.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /offers/1 or /offers/1.json
  def destroy
    @offer.destroy
    respond_to do |format|
      notice = t('.success')
      format.html { redirect_to offers_url, notice: notice }
      format.json { head :no_content }
      format.turbo_stream { flash.now.notice = notice }
    end
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_offer
    @offer = current_account.offers.find(params[:id])
  end

  # Only allow a list of trusted parameters through.
  def offer_params
    params.require(:offer).permit(:account_id, :type, :offer_type, :internal_code, :name, :description, :unit, :selling_price_cents, :cost_price_cents, :currency, :data, :metadata, :enabled, :discarded_at)
  end
end
