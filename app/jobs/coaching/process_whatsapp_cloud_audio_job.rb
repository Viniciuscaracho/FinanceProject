# frozen_string_literal: true

module Coaching
  # Processa áudio recebido via WhatsApp Cloud API (Meta Graph API).
  #
  # Fluxo:
  #   1. Dedup por media_id (Meta reenvia webhooks — evita processamento duplo)
  #   2. Verifica créditos disponíveis
  #   3. Baixa o arquivo de áudio via CloudApiClient (2 chamadas à Graph API)
  #   4. Transcreve com Whisper (TranscribeAudioService)
  #   5. Gate de transcrição curta — skip de GPT em áudios de ruído/tosse
  #   6. ParseAudioContextService extrai atleta + campos de coaching
  #   7. Resolve/cria contato e CoachingProfile
  #   8. Cria TimelineEvent com source: 'whatsapp_audio'
  class ProcessWhatsappCloudAudioJob < ApplicationJob
    queue_as :default

    # Meta pode reenviar o mesmo webhook; 24h é mais que suficiente para dedup.
    MEDIA_ID_CACHE_TTL = 24.hours
    # Transcrições abaixo desse tamanho são ruído (tosse, clique, silêncio).
    MIN_TRANSCRIPT_LENGTH = 15

    def perform(account_id:, media_id:, from:)
      account = Account.find_by(id: account_id)
      return unless account

      # ── Harness 1: dedup de media_id ──────────────────────────────────────
      # Cache é escrito aqui — antes de qualquer trabalho — para que retries e
      # webhooks duplicados sejam descartados independente de falha posterior.
      cache_key = "wca_processed:#{account_id}:#{media_id}"
      if Rails.cache.exist?(cache_key)
        Rails.logger.info "[ProcessWhatsappCloudAudioJob] media_id=#{media_id} já processado — ignorado (dedup)"
        return
      end
      Rails.cache.write(cache_key, true, expires_in: MEDIA_ID_CACHE_TTL)

      credits = ::Coaching::CreditsService.for(account)
      unless credits.enough?
        Rails.logger.warn "[ProcessWhatsappCloudAudioJob] Créditos esgotados na conta ##{account_id} — áudio ignorado"
        return
      end

      media = WhatsApp::CloudApiClient.download_media(media_id: media_id)
      unless media
        Rails.logger.warn "[ProcessWhatsappCloudAudioJob] Falha ao baixar media_id=#{media_id}"
        return
      end

      audio_file = AudioFileWrapper.new(media[:bytes], media[:mime_type], media[:filename])

      transcript = ::Coaching::TranscribeAudioService.new(audio_file).call
      unless transcript.present?
        Rails.logger.warn "[ProcessWhatsappCloudAudioJob] Whisper retornou transcrição vazia para media_id=#{media_id}"
        return
      end

      # ── Harness 2: gate de transcrição curta ──────────────────────────────
      if transcript.strip.length < MIN_TRANSCRIPT_LENGTH
        Rails.logger.info "[ProcessWhatsappCloudAudioJob] Transcrição muito curta (#{transcript.strip.length} chars) — skip GPT"
        return
      end

      Rails.logger.info "[ProcessWhatsappCloudAudioJob] Transcrição: #{transcript.truncate(120)}"

      parsed  = ::Coaching::ParseAudioContextService.new(transcript).call
      contact = resolve_contact(account, parsed[:athlete_name], from)

      unless contact
        Rails.logger.warn "[ProcessWhatsappCloudAudioJob] Contato não encontrado para '#{parsed[:athlete_name] || from}' (conta ##{account_id})"
        return
      end

      profile = ensure_coaching_profile(account, contact)
      update_profile(profile, parsed)

      event = ActsAsTenant.with_tenant(account) do
        TimelineEvent.create!(
          account:      account,
          contact:      contact,
          raw_input:    transcript,
          source:       'whatsapp_audio',
          sono:         parsed[:sono],
          carga:        parsed[:carga],
          observacao:   parsed[:observacao],
          proxima_acao: parsed[:proxima_acao]
        )
      end

      credits.debit_audio!(source: event)
      profile.update_columns(last_feedback_at: Time.current)
    rescue Coaching::CreditsService::InsufficientCredits => e
      Rails.logger.warn "[ProcessWhatsappCloudAudioJob] #{e.message} (conta ##{account_id}) — TimelineEvent criado sem débito"
    rescue StandardError => e
      Rails.logger.error "[ProcessWhatsappCloudAudioJob] #{e.class}: #{e.message}\n#{e.backtrace.first(5).join("\n")}"
    end

    private

    def resolve_contact(account, athlete_name, from_phone)
      ::Coaching::ContactResolverService.new(
        account,
        extracted_name: athlete_name,
        from_phone:     from_phone
      ).call
    end

    def ensure_coaching_profile(account, contact)
      contact.coaching_profile ||
        CoachingProfile.create!(account: account, contact: contact)
    end

    def update_profile(profile, parsed)
      updates = {}
      updates[:goal]                 = parsed[:goal]                 if parsed[:goal].present?
      updates[:next_reassessment_at] = parsed[:days_to_reassessment].days.from_now if parsed[:days_to_reassessment].present?
      profile.update!(updates) if updates.any?
    end

    AudioFileWrapper = Struct.new(:_bytes, :content_type, :original_filename) do
      def read
        _bytes
      end
    end
  end
end
