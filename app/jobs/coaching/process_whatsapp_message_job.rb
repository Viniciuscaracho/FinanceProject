# frozen_string_literal: true

module Coaching
  # Processa mensagens WhatsApp recebidas pelo treinador e cria TimelineEvent estruturado.
  # Formato esperado: "Nome do Atleta: texto livre sobre o treino/sono/dor/etc."
  # Se não houver ":" no início, tenta associar ao último atleta ativo ou ignora.
  class ProcessWhatsappMessageJob < ApplicationJob
    queue_as :default

    def perform(account_id:, message:, whatsapp_number:)
      account = Account.find_by(id: account_id)
      return unless account

      contact, raw_text = extract_contact_and_text(account, message)
      return unless contact && raw_text.present?

      ActsAsTenant.with_tenant(account) do
        structured = ::Coaching::StructureNoteService.new(raw_text).call

        TimelineEvent.create!(
          account:      account,
          contact:      contact,
          raw_input:    raw_text,
          source:       'whatsapp',
          sono:         structured[:sono],
          carga:        structured[:carga],
          observacao:   structured[:observacao],
          proxima_acao: structured[:proxima_acao]
        )
      end
    rescue StandardError => e
      Rails.logger.error "[Coaching::ProcessWhatsappMessageJob] #{e.message}"
    end

    private

    def extract_contact_and_text(account, message)
      # Formato: "Nome Atleta: texto" ou só "texto" (associa ao último atleta)
      if message.include?(':')
        parts    = message.split(':', 2)
        name     = parts[0].strip
        raw_text = parts[1].strip

        contact = ::Coaching::ContactResolverService.new(
          account, extracted_name: name
        ).call

        return [contact, raw_text] if contact
      end

      # Sem prefixo de nome — usa contato mais recente com coaching ativo
      contact = CoachingProfile
        .where(account: account)
        .order(updated_at: :desc)
        .first
        &.contact
      [contact, message.strip]
    end
  end
end
