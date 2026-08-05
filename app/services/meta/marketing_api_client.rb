# frozen_string_literal: true

module Meta
  # Cliente para a Meta Marketing API (Graph API v20.0).
  #
  # Usa um System User token de longa duração da conta de anúncios da Orbi.
  # Hierarquia de criação: Campaign → AdSet → AdCreative → Ad.
  #
  # Todas as entidades criadas partem com status PAUSED — ative manualmente no
  # Gerenciador de Anúncios após revisar.
  class MarketingApiClient
    GRAPH_BASE = 'https://graph.facebook.com/v25.0'

    def initialize(
      access_token: ENV.fetch('META_ADS_ACCESS_TOKEN', nil),
      ad_account_id: ENV.fetch('META_ADS_ACCOUNT_ID', nil)
    )
      @access_token  = access_token
      @ad_account_id = ad_account_id  # formato: act_XXXXXXXXXX
    end

    # ── Campaigns ─────────────────────────────────────────────────────────────

    def list_campaigns
      get("/#{@ad_account_id}/campaigns",
          fields:           'id,name,status,effective_status,objective,daily_budget,created_time',
          effective_status: %w[ACTIVE PAUSED WITH_ISSUES CAMPAIGN_PAUSED
                               PENDING_REVIEW DISAPPROVED ARCHIVED].to_json)
    end

    def get_campaign(campaign_id)
      get("/#{campaign_id}", fields: 'id,name,status,objective,daily_budget,created_time')
    end

    # Cria campanha de tráfego. Sempre inicia PAUSED.
    def create_campaign(name:, status: 'PAUSED')
      post("/#{@ad_account_id}/campaigns", {
        name:                            name,
        objective:                       'OUTCOME_TRAFFIC',
        status:                          status,
        special_ad_categories:           '[]',
        is_adset_budget_sharing_enabled: 'false'
      })
    end

    def update_campaign(campaign_id, attrs)
      post_update("/#{campaign_id}", attrs.slice(:name, :status, :daily_budget))
    end

    def delete_campaign(campaign_id)
      delete("/#{campaign_id}")
    end

    # ── AdSets ────────────────────────────────────────────────────────────────

    def list_adsets(campaign_id:)
      get("/#{campaign_id}/adsets",
          fields: 'id,name,status,daily_budget,targeting,optimization_goal,created_time')
    end

    # daily_budget em centavos (R$50 = 5000).
    # targeting: hash com geo_locations, age_min, age_max, interests, etc.
    def create_adset(name:, campaign_id:, daily_budget:, targeting: {}, status: 'PAUSED')
      normalized = default_targeting.merge(targeting)
      post("/#{@ad_account_id}/adsets", {
        name:              name,
        campaign_id:       campaign_id,
        daily_budget:      daily_budget.to_s,
        billing_event:     'IMPRESSIONS',
        optimization_goal: 'LINK_CLICKS',
        bid_strategy:      'LOWEST_COST_WITHOUT_CAP',
        targeting:         normalized.to_json,
        status:            status
      })
    end

    def update_adset(adset_id, attrs)
      post_update("/#{adset_id}", attrs.slice(:name, :status, :daily_budget))
    end

    # ── Ad Creatives ──────────────────────────────────────────────────────────

    # page_id: ID da Página do Facebook da Orbi.
    # link: URL de destino do anúncio.
    # message: texto do post / corpo do anúncio.
    # cta_type: LEARN_MORE | SIGN_UP | APPLY_NOW | GET_QUOTE ...
    def create_creative(name:, page_id:, link:, message:, cta_type: 'LEARN_MORE', image_hash: nil)
      link_data = {
        link:            link,
        message:         message,
        call_to_action: {
          type:  cta_type,
          value: { link: link }
        }
      }
      link_data[:image_hash] = image_hash if image_hash.present?

      post("/#{@ad_account_id}/adcreatives", {
        name:               name,
        object_story_spec:  {
          page_id:   page_id,
          link_data: link_data
        }.to_json
      })
    end

    # Upload de imagem — retorna image_hash para usar no creative.
    def upload_image(file_path:)
      post("/#{@ad_account_id}/adimages", { filename: File.basename(file_path) }, file_path: file_path)
    end

    # Upload de vídeo — retorna { video_id, title } para usar no creative.
    # Vídeos até ~1 GB: multipart simples via /advideos.
    def upload_video(file_path:, title: nil)
      body = { filename: File.basename(file_path) }
      body[:title] = title if title.present?
      post("/#{@ad_account_id}/advideos", body, file_path: file_path, file_field: :source)
    end

    # Creative de vídeo (Reels, Feed, Stories).
    # video_id: retornado por upload_video.
    # instagram_actor_id: ID da conta IG vinculada (opcional — se presente, publica pelo IG).
    def create_video_creative(name:, page_id:, video_id:, message:, link:,
                              cta_type: 'LEARN_MORE', instagram_actor_id: nil, image_hash: nil)
      video_data = {
        video_id:       video_id,
        message:        message,
        call_to_action: {
          type:  cta_type,
          value: { link: link }
        }
      }
      video_data[:image_hash] = image_hash if image_hash.present?

      story_spec = { page_id: page_id, video_data: video_data }
      story_spec[:instagram_actor_id] = instagram_actor_id if instagram_actor_id.present?

      post("/#{@ad_account_id}/adcreatives", {
        name:              name,
        object_story_spec: story_spec.to_json
      })
    end

    # Creative a partir de post orgânico existente do Instagram.
    # object_story_id: "{page_id}_{ig_media_id}" — obtido via list_instagram_media.
    def create_post_creative(name:, object_story_id:, instagram_actor_id:)
      post("/#{@ad_account_id}/adcreatives", {
        name:                name,
        instagram_actor_id:  instagram_actor_id,
        object_story_id:     object_story_id
      })
    end

    # ── Instagram ─────────────────────────────────────────────────────────────

    # Retorna o Instagram Business Account vinculado à página.
    def get_instagram_account(page_id)
      get("/#{page_id}", fields: 'instagram_business_account')
    end

    # Lista posts de mídia da conta IG. Retorna id, caption, media_type, timestamp.
    def list_instagram_media(ig_account_id)
      get("/#{ig_account_id}/media",
          fields: 'id,caption,media_type,media_url,thumbnail_url,timestamp,permalink')
    end

    # ── Ads ───────────────────────────────────────────────────────────────────

    def list_ads(adset_id:)
      get("/#{adset_id}/ads", fields: 'id,name,status,creative,created_time')
    end

    def create_ad(name:, adset_id:, creative_id:, status: 'PAUSED')
      post("/#{@ad_account_id}/ads", {
        name:     name,
        adset_id: adset_id,
        creative: { creative_id: creative_id }.to_json,
        status:   status
      })
    end

    def update_ad(ad_id, attrs)
      post_update("/#{ad_id}", attrs.slice(:name, :status))
    end

    # ── Insights (relatórios) ─────────────────────────────────────────────────

    INSIGHT_FIELDS = 'impressions,clicks,spend,ctr,cpc,reach,frequency,actions'

    def campaign_insights(campaign_id:, date_preset: 'last_30d')
      get("/#{campaign_id}/insights",
          fields:      INSIGHT_FIELDS,
          date_preset: date_preset,
          level:       'campaign')
    end

    def adset_insights(adset_id:, date_preset: 'last_30d')
      get("/#{adset_id}/insights",
          fields:      INSIGHT_FIELDS,
          date_preset: date_preset,
          level:       'adset')
    end

    def account_insights(date_preset: 'last_30d')
      get("/#{@ad_account_id}/insights",
          fields:      INSIGHT_FIELDS,
          date_preset: date_preset,
          level:       'account')
    end

    private

    def default_targeting
      {
        geo_locations:         { countries: ['BR'] },
        age_min:               20,
        age_max:               60,
        targeting_automation:  { advantage_audience: 0 }
      }
    end

    def get(path, params = {})
      response = HTTParty.get(
        "#{GRAPH_BASE}#{path}",
        query:   params.merge(access_token: @access_token),
        timeout: 30
      )
      handle_response(response, "GET #{path}")
    end

    def post(path, body = {}, file_path: nil, file_field: :source)
      opts = {
        query:   { access_token: @access_token },
        body:    body,
        timeout: 120
      }
      if file_path
        opts[:multipart] = true
        opts[:body][file_field] = File.new(file_path)
      end

      response = HTTParty.post("#{GRAPH_BASE}#{path}", opts)
      handle_response(response, "POST #{path}")
    end

    def post_update(path, body = {})
      response = HTTParty.post(
        "#{GRAPH_BASE}#{path}",
        query:   { access_token: @access_token },
        body:    body,
        timeout: 30
      )
      handle_response(response, "POST(update) #{path}")
    end

    def delete(path)
      response = HTTParty.delete(
        "#{GRAPH_BASE}#{path}",
        query:   { access_token: @access_token },
        timeout: 30
      )
      handle_response(response, "DELETE #{path}")
    end

    def handle_response(response, label)
      parsed = response.parsed_response
      has_error = parsed.is_a?(Hash) && parsed['error'].present?

      if response.success? && !has_error
        { success: true, data: parsed }
      else
        error = has_error ? parsed['error'] : { 'message' => "HTTP #{response.code}" }
        Rails.logger.error "[Meta::MarketingApiClient] #{label} — #{error}"
        { success: false, error: error }
      end
    end
  end
end
