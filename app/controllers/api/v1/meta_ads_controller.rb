# frozen_string_literal: true

module Api
  module V1
    # Endpoints de gerenciamento de anúncios da Orbi via Meta Marketing API.
    # Exclusivo para o system admin (current_user.admin?).
    #
    # Hierarquia: Campaign → AdSet → AdCreative → Ad
    # Todas as entidades são criadas com status PAUSED por padrão.
    class MetaAdsController < ApplicationController
      before_action :authenticate_user!
      before_action :authenticate_admin!

      # GET /api/v1/admin/meta_ads/campaigns
      def campaigns
        render_result client.list_campaigns
      end

      # GET /api/v1/admin/meta_ads/campaigns/:id
      def show_campaign
        render_result client.get_campaign(params[:id])
      end

      # POST /api/v1/admin/meta_ads/campaigns
      # Body: { name: }
      def create_campaign
        render_result client.create_campaign(name: params.require(:name))
      end

      # PATCH /api/v1/admin/meta_ads/campaigns/:id
      # Body: { name?, status? }
      def update_campaign
        render_result client.update_campaign(params[:id], campaign_attrs)
      end

      # DELETE /api/v1/admin/meta_ads/campaigns/:id
      def destroy_campaign
        render_result client.delete_campaign(params[:id])
      end

      # GET /api/v1/admin/meta_ads/campaigns/:campaign_id/adsets
      def adsets
        render_result client.list_adsets(campaign_id: params[:campaign_id])
      end

      # POST /api/v1/admin/meta_ads/adsets
      # Body: { name:, campaign_id:, daily_budget: (centavos), targeting?: {} }
      def create_adset
        render_result client.create_adset(
          name:          params.require(:name),
          campaign_id:   params.require(:campaign_id),
          daily_budget:  params.require(:daily_budget).to_i,
          targeting:     targeting_params
        )
      end

      # PATCH /api/v1/admin/meta_ads/adsets/:id
      def update_adset
        render_result client.update_adset(params[:id], adset_attrs)
      end

      # POST /api/v1/admin/meta_ads/creatives
      # Body: { name:, link:, message:, cta_type?: "LEARN_MORE", image_hash?: }
      def create_creative
        render_result client.create_creative(
          name:       params.require(:name),
          page_id:    ENV.fetch('META_FB_PAGE_ID'),
          link:       params.require(:link),
          message:    params.require(:message),
          cta_type:   params.fetch(:cta_type, 'LEARN_MORE'),
          image_hash: params[:image_hash]
        )
      end

      # GET /api/v1/admin/meta_ads/adsets/:adset_id/ads
      def ads
        render_result client.list_ads(adset_id: params[:adset_id])
      end

      # POST /api/v1/admin/meta_ads/ads
      # Body: { name:, adset_id:, creative_id: }
      def create_ad
        render_result client.create_ad(
          name:        params.require(:name),
          adset_id:    params.require(:adset_id),
          creative_id: params.require(:creative_id)
        )
      end

      # PATCH /api/v1/admin/meta_ads/ads/:id
      def update_ad
        render_result client.update_ad(params[:id], params.permit(:name, :status))
      end

      # GET /api/v1/admin/meta_ads/insights/account
      def account_insights
        render_result client.account_insights(date_preset: params.fetch(:date_preset, 'last_30d'))
      end

      # GET /api/v1/admin/meta_ads/insights/campaign/:campaign_id
      def campaign_insights
        render_result client.campaign_insights(
          campaign_id: params[:campaign_id],
          date_preset: params.fetch(:date_preset, 'last_30d')
        )
      end

      # GET /api/v1/admin/meta_ads/insights/adset/:adset_id
      def adset_insights
        render_result client.adset_insights(
          adset_id:    params[:adset_id],
          date_preset: params.fetch(:date_preset, 'last_30d')
        )
      end

      private

      def client
        @client ||= Meta::MarketingApiClient.new
      end

      def authenticate_admin!
        render json: { error: 'Acesso negado' }, status: :forbidden unless current_user&.admin?
      end

      def targeting_params
        return {} unless params[:targeting].is_a?(ActionController::Parameters)

        t = params[:targeting]
        result = {}
        result[:geo_locations] = { countries: Array(t[:countries]) } if t[:countries].present?
        result[:age_min] = t[:age_min].to_i if t[:age_min].present?
        result[:age_max] = t[:age_max].to_i if t[:age_max].present?
        result
      end

      def campaign_attrs
        params.permit(:name, :status)
      end

      def adset_attrs
        params.permit(:name, :status, :daily_budget)
      end

      def render_result(result)
        if result[:success]
          render json: result[:data]
        else
          render json: { error: result[:error] }, status: :unprocessable_entity
        end
      end
    end
  end
end
