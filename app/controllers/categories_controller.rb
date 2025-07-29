# frozen_string_literal: true

class CategoriesController < ApplicationController
  rescue_from Pagy::OverflowError, with: :redirect_to_last_page

  # Callbacks
  before_action :ensure_frame_response, only: %i[new]
  before_action :set_category, only: %i[show edit update destroy]

  # GET /categories or /categories.json
  def index
    authorize! :read, Category

    query = Current.account.categories.sort_by_params(sort_column(Category, default: :name), sort_direction)
    query = query.search_by_q(params[:q]) if params[:q].present?

    if params[:transaction_type].present?
      query = query.where(transaction_type_cd: Category.transaction_types[params[:transaction_type]])
    end

    @pagy, @records = pagy(query)

    @records.load
  end

  # GET /categories/1 or /categories/1.json
  def show
    authorize! :read, Category
  end

  # GET /categories/new
  def new
    authorize! :create, Category
    @category = Category.new(transaction_type: params[:transaction_type])
  end

  def new_import_from_presets
    authorize! :create, Category

    sector_activity = SectorActivity.find_by(id: params[:sector_activity_id]) || Current.account.company.sector_activity

    @category_presets = CategoryPreset.order(:transaction_type_cd, :name)
    @category_presets = @category_presets.where(sector_activity:) if sector_activity
    @grouped_category_presets = @category_presets.group_by(&:transaction_type)
  end

  # GET /categories/1/edit
  def edit
    authorize! :update, Category
  end

  # POST /categories or /categories.json
  def create
    authorize! :create, Category

    result = Categories::Create.call(account: Current.account, category_params:)
    @category = result.category

    respond_to do |format|
      if result.success?
        notice = t('.success')
        format.html { redirect_to categories_url, notice: }
        format.json { render :show, status: :created, location: @category }
        format.turbo_stream { flash.now.notice = notice }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @category.errors, status: :unprocessable_entity }
      end
    end
  end

  def import_selected_presets; end

  # PATCH/PUT /categories/1 or /categories/1.json
  def update
    authorize! :update, Category

    result = Categories::Update.call(category: @category, category_params:)
    respond_to do |format|
      if result.success?
        notice = t('.success')
        format.html { redirect_to categories_url, notice: }
        format.json { render :show, status: :ok, location: @category }
        format.turbo_stream { flash.now.notice = notice }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @category.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /categories/1 or /categories/1.json
  def destroy
    authorize! :destroy, Category

    Categories::Discard.call(category: @category)
    respond_to do |format|
      notice = t('.success')
      format.html { redirect_to categories_url, notice: }
      format.json { head :no_content }
      format.turbo_stream { flash.now.notice = notice }
    end
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_category
    @category = Current.account.categories.find(params[:id])
  end

  # Only allow a list of trusted parameters through.
  def category_params
    params.require(:category).permit(:name, :description, :transaction_type)
  end

  def redirect_to_last_page(exception)
    redirect_to url_for(page: exception.pagy.last)
  end
end
