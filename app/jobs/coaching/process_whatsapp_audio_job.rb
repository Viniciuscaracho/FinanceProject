# frozen_string_literal: true

module Coaching
  # Processa mensagens de áudio WhatsApp enviadas pelo treinador (fromMe: true).
  #
  # Fluxo:
  #   1. Baixa áudio via Evolution API
  #   2. Transcreve com Whisper
  #   3. ParseAudioContextService extrai nome do atleta + campos de coaching + planejamento
  #   4. Acha o contato por nome (transcrição) ou número (remoteJid) ou coaching mais recente
  #   5. Cria o contato se não existir e o nome foi extraído
  #   6. Garante CoachingProfile e atualiza goal/next_reassessment_at se mencionados
  #   7. Cria TimelineEvent com source: 'whatsapp_audio'
  class ProcessWhatsappAudioJob < ApplicationJob
    queue_as :default

    def perform(account_id:, message_key:, message_body:, from:)
      account = Account.find_by(id: account_id)
      return unless account

      # ── Dedup por message ID (Evolution pode reenviar o mesmo webhook) ────────
      msg_id    = message_key.is_a?(Hash) ? (message_key['id'] || message_key[:id]) : nil
      cache_key = "wa_evo_audio:#{account_id}:#{msg_id}" if msg_id.present?
      if cache_key && Rails.cache.exist?(cache_key)
        Rails.logger.info "[ProcessWhatsappAudioJob] msg_id=#{msg_id} já processado — ignorado (dedup)"
        return
      end
      Rails.cache.write(cache_key, true, expires_in: 24.hours) if cache_key

      credits = ::Coaching::CreditsService.for(account)
      unless credits.enough?
        Rails.logger.warn "[Coaching::ProcessWhatsappAudioJob] Créditos esgotados na conta ##{account_id} — áudio ignorado"
        return
      end

      media = WhatsApp::EvolutionApiClient.download_media(
        account:      account,
        message_key:  message_key,
        message_body: message_body
      )
      return unless media

      audio_file = AudioFileWrapper.new(
        Base64.decode64(media[:base64]),
        media[:mimetype],
        media[:filename]
      )

      transcript = ::Coaching::TranscribeAudioService.new(audio_file).call
      unless transcript.present?
        Rails.logger.warn "[Coaching::ProcessWhatsappAudioJob] Whisper retornou transcrição vazia"
        return
      end

      parsed = ::Coaching::ParseAudioContextService.new(transcript).call

      contact = resolve_contact(account, parsed[:athlete_name], from)
      unless contact
        Rails.logger.warn "[Coaching::ProcessWhatsappAudioJob] Contato não encontrado para '#{parsed[:athlete_name] || from}' na conta ##{account_id}"
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
    rescue StandardError => e
      Rails.logger.error "[Coaching::ProcessWhatsappAudioJob] #{e.class}: #{e.message}"
    end

    private

    # Delega ao ContactResolverService (cascata unaccent+fuzzy+trigram+telefone)
    # para consistência com o Cloud Audio path.
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
