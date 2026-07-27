# frozen_string_literal: true

module WhatsApp
  # Baixa mídia do WhatsApp Cloud API (Meta Graph API).
  #
  # Fluxo de 2 etapas:
  #   1. GET /v20.0/{media_id} → retorna { url, mime_type, file_size }
  #   2. GET {url} com Authorization: Bearer → retorna bytes do arquivo
  class CloudApiClient
    GRAPH_BASE = 'https://graph.facebook.com/v20.0'

    # Retorna { bytes:, mime_type:, filename: } ou nil em caso de erro.
    def self.download_media(media_id:, access_token: ENV['WHATSAPP_ACCESS_TOKEN'])
      new(access_token).download_media(media_id)
    end

    def initialize(access_token)
      @access_token = access_token
    end

    def download_media(media_id)
      meta = fetch_media_meta(media_id)
      return nil unless meta

      bytes = fetch_media_bytes(meta[:url])
      return nil unless bytes

      ext = ext_for(meta[:mime_type])
      {
        bytes:     bytes,
        mime_type: meta[:mime_type],
        filename:  "audio_#{media_id}#{ext}"
      }
    rescue StandardError => e
      Rails.logger.error "[CloudApiClient] download_media #{media_id}: #{e.class} #{e.message}"
      nil
    end

    private

    def fetch_media_meta(media_id)
      uri = URI("#{GRAPH_BASE}/#{media_id}")
      res = get_with_auth(uri)
      unless res.is_a?(Net::HTTPSuccess)
        Rails.logger.error "[CloudApiClient] fetch_meta #{media_id}: HTTP #{res.code} #{res.body.truncate(200)}"
        return nil
      end

      parsed = JSON.parse(res.body, symbolize_names: true)
      if parsed[:url].blank?
        Rails.logger.error "[CloudApiClient] fetch_meta #{media_id}: sem URL na resposta: #{res.body.truncate(200)}"
        return nil
      end

      parsed
    end

    def fetch_media_bytes(url)
      uri = URI(url)
      res = get_with_auth(uri)
      unless res.is_a?(Net::HTTPSuccess)
        Rails.logger.error "[CloudApiClient] fetch_bytes: HTTP #{res.code} #{res.body.truncate(200)}"
        return nil
      end

      res.body.force_encoding(Encoding::BINARY)
    end

    def get_with_auth(uri)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.read_timeout = 30

      req = Net::HTTP::Get.new(uri)
      req['Authorization'] = "Bearer #{@access_token}"
      http.request(req)
    end

    def ext_for(mime_type)
      case mime_type.to_s
      when /ogg/  then '.ogg'
      when /mp4/  then '.mp4'
      when /mpeg/ then '.mp3'
      when /webm/ then '.webm'
      else '.ogg'
      end
    end
  end
end
