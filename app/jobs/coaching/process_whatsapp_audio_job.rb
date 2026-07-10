# frozen_string_literal: true

module Coaching
  # Processa mensagens de áudio WhatsApp enviadas pelo treinador (fromMe: true).
  # Fluxo: Evolution API download → Whisper transcrição → StructureNoteService → TimelineEvent.
  # O remoteJid (número do atleta) é usado para identificar o contato.
  class ProcessWhatsappAudioJob < ApplicationJob
    queue_as :default

    def perform(account_id:, message_key:, message_body:, from:)
      account = Account.find_by(id: account_id)
      return unless account

      contact = find_contact(account, from)
      unless contact
        Rails.logger.warn "[Coaching::ProcessWhatsappAudioJob] Contato não encontrado para #{from} na conta ##{account_id}"
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
        Rails.logger.warn "[Coaching::ProcessWhatsappAudioJob] Whisper retornou transcrição vazia para contato ##{contact.id}"
        return
      end

      structured = ::Coaching::StructureNoteService.new(transcript).call

      ActsAsTenant.with_tenant(account) do
        TimelineEvent.create!(
          account:      account,
          contact:      contact,
          raw_input:    transcript,
          source:       'whatsapp_audio',
          sono:         structured[:sono],
          carga:        structured[:carga],
          observacao:   structured[:observacao],
          proxima_acao: structured[:proxima_acao]
        )
      end

      contact.coaching_profile&.update_columns(last_feedback_at: Time.current)
    rescue StandardError => e
      Rails.logger.error "[Coaching::ProcessWhatsappAudioJob] #{e.class}: #{e.message}"
    end

    private

    def find_contact(account, from_phone)
      digits = from_phone.gsub(/\D/, '')
      # Últimos 8 dígitos cobrem DDI+DDD variados (BR: 55 11 9xxxx-xxxx)
      suffix = digits.last(8)
      account.contacts.find_by(
        "REGEXP_REPLACE(cell_phone_number, '[^0-9]', '', 'g') LIKE ?",
        "%#{suffix}"
      )
    end

    # Wrapper simples que satisfaz a interface do TranscribeAudioService
    AudioFileWrapper = Struct.new(:_bytes, :content_type, :original_filename) do
      def read
        _bytes
      end
    end
  end
end
