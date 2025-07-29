# frozen_string_literal: true

class CategoryPresetsController < ApplicationController
  before_action :set_sector_activity

  # GET /categories or /categories.json
  def index
    authorize! :read, Category

    if @sector_activity.present?
      category_presets = @sector_activity.category_presets.includes(:sector_activity).order(:transaction_type_cd, :name)
      @grouped_category_presets = category_presets.group_by(&:transaction_type)
    else
      @grouped_category_presets = []
    end
  end

  def import
    authorize! :create, Category

    ActiveRecord::Base.transaction { import_categories_and_update_company }
    redirect_to categories_url, notice: t('.success')
  end

  private

  def import_categories_and_update_company
    category_presets = CategoryPreset.where(id: params[:category_preset_ids])
    category_presets.each do |category_preset|
      category = Current.account.categories.find_or_initialize_by(name: category_preset.name)
      category.assign_attributes(category_preset.attributes.slice('name', 'description', 'transaction_type_cd'))
      category.save
    end

    Current.account.company.update(sector_activity: @sector_activity) if Current.account.company.sector_activity.blank?
  end

  # Use callbacks to share common setup or constraints between actions.
  def set_sector_activity
    @sector_activity = SectorActivity.find_by(id: params[:sector_activity_id])
    @sector_activity = Current.account.company.sector_activity if @sector_activity.blank?
  end
end
