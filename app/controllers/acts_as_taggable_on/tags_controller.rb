# frozen_string_literal: true
module ActsAsTaggableOn
  class TagsController < ApplicationController
    rescue_from Pagy::OverflowError, with: :redirect_to_last_page

    before_action :set_tag, only: [:show, :edit, :update, :destroy]
    def index
      authorize! :read, ActsAsTaggableOn::Tag

      query = Current.account.transactions.tag_counts_on(:tags)
      query = query.search_by_q(params[:q]) if params[:q].present?
      query = query.order(:name)

      @pagy, @records = pagy(query, items: 20)

      @records.load
    end

    def show; end

    def edit
      authorize! :update, ActsAsTaggableOn::Tag
      render layout: false
    end

    def new
      authorize! :create, ActsAsTaggableOn::Tag

      @tag = ActsAsTaggableOn::Tag.new(tenant: Current.account)
      render layout: false
    end

    def create
      authorize! :create, ActsAsTaggableOn::Tag

      @tag = ActsAsTaggableOn::Tag.for_tenant(Current.account.id).create(tag_params)
    end

    def update
      authorize! :update, ActsAsTaggableOn::Tag

      @tag.update(tag_params)
    end

    def destroy
      authorize! :destroy, ActsAsTaggableOn::Tag

      ActsAsTaggableOn::Tag.for_tenant(Current.account.id).find(params[:id]).destroy

    end

    private

    def set_tag
      @tag = ActsAsTaggableOn::Tag.for_tenant(Current.account.id).find(params[:id])
    end

    def tag_params
      params.require(:acts_as_taggable_on_tag).permit(:name)
    end
  end
end

