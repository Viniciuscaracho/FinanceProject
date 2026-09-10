# frozen_string_literal: true

module English
  # Orchestrates importing a conversation: fetch (if URL), extract cards, persist.
  class ImportConversationService
    def initialize(user:, url: nil, raw_text: nil)
      @user     = user
      @url      = url.presence
      @raw_text = raw_text.presence
    end

    def call
      return { ok: false, error: 'Informe uma URL ou cole o texto da conversa' } if @url.blank? && @raw_text.blank?

      text, fetch_error = resolve_text
      return { ok: false, error: fetch_error } if text.blank?

      session = EnglishSession.create!(
        user:        @user,
        url:         @url,
        raw_content: text,
        status:      'pending'
      )

      result = English::ExtractCardsService.new(session: session, text: text).call

      if result[:ok]
        session.update!(status: 'processed')
        { ok: true, session: session, cards: result[:cards] }
      else
        session.update!(status: 'failed')
        { ok: false, error: result[:error] }
      end
    end

    private

    def resolve_text
      return [@raw_text, nil] if @raw_text.present?

      result = English::FetchConversationService.new(@url).call
      if result[:ok]
        [result[:text], nil]
      else
        [nil, result[:error]]
      end
    end
  end
end
