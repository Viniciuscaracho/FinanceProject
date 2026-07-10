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
      Rails.logger.error "[Coaching::ProcessWhatsappAudioJob] #{e.class}: #{e.message}"
    end

    private

    # Resolve o contato na seguinte ordem de prioridade:
    #   1. Nome extraído da transcrição → busca por nome, ou cria novo contato
    #   2. Número do remoteJid → busca por cell_phone_number
    #   3. Fallback → contato com CoachingProfile mais recentemente atualizado
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
      Rails.logger.info "[Coaching::ProcessWhatsappAudioJob] Contato criado via áudio: #{contact.name} (##{contact.id})"
      contact
    rescue ActiveRecord::RecordInvalid => e
      Rails.logger.error "[Coaching::ProcessWhatsappAudioJob] Falha ao criar contato '#{name}': #{e.message}"
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
