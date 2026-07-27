# frozen_string_literal: true

module Coaching
  # Processa áudio recebido via WhatsApp Cloud API (Meta Graph API).
  #
  # Fluxo:
  #   1. Baixa o arquivo de áudio via CloudApiClient (2 chamadas à Graph API)
  #   2. Transcreve com Whisper (TranscribeAudioService)
  #   3. ParseAudioContextService extrai atleta + campos de coaching
  #   4. Resolve/cria contato e CoachingProfile
  #   5. Cria TimelineEvent com source: 'whatsapp_audio'
  class ProcessWhatsappCloudAudioJob < ApplicationJob
    queue_as :default

    def perform(account_id:, media_id:, from:)
      account = Account.find_by(id: account_id)
      return unless account

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

      Rails.logger.info "[ProcessWhatsappCloudAudioJob] Transcrição: #{transcript.truncate(120)}"

      parsed  = ::Coaching::ParseAudioContextService.new(transcript).call
      contact = resolve_contact(account, parsed[:athlete_name], from)

      unless contact
        Rails.logger.warn "[ProcessWhatsappCloudAudioJob] Contato não encontrado para '#{parsed[:athlete_name] || from}' (conta ##{account_id})"
        return
      end

      profile = ensure_coaching_profile(account, contact)
      update_profile(profile, parsed)

      ActsAsTenant.with_tenant(account) do
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

      profile.update_columns(last_feedback_at: Time.current)
    rescue StandardError => e
      Rails.logger.error "[ProcessWhatsappCloudAudioJob] #{e.class}: #{e.message}\n#{e.backtrace.first(5).join("\n")}"
    end

    private

    def resolve_contact(account, athlete_name, from_phone)
      if athlete_name.present?
        contact = find_by_name(account, athlete_name)
        return contact if contact

        return create_contact_from_audio(account, athlete_name)
      end

      find_by_phone(account, from_phone) || fallback_recent(account)
    end

    def find_by_name(account, name)
      account.contacts.where(
        "LOWER(CONCAT(first_name, ' ', COALESCE(last_name, ''))) LIKE ?",
        "%#{name.downcase}%"
      ).first
    end

    def create_contact_from_audio(account, name)
      contact = account.contacts.create!(
        name:         name.strip,
        contact_type: :undefined_contact,
        person_type:  :natural
      )
      Rails.logger.info "[ProcessWhatsappCloudAudioJob] Contato criado via áudio: #{contact.name} (##{contact.id})"
      contact
    rescue ActiveRecord::RecordInvalid => e
      Rails.logger.error "[ProcessWhatsappCloudAudioJob] Falha ao criar contato '#{name}': #{e.message}"
      nil
    end

    def find_by_phone(account, from_phone)
      suffix = from_phone.gsub(/\D/, '').last(8)
      account.contacts.find_by(
        "REGEXP_REPLACE(cell_phone_number, '[^0-9]', '', 'g') LIKE ?",
        "%#{suffix}"
      )
    end

    def fallback_recent(account)
      CoachingProfile.where(account: account)
                     .order(updated_at: :desc)
                     .first
                     &.contact
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
