# frozen_string_literal: true

module English
  # Sends a conversation to Claude and extracts flashcards.
  # Returns { ok: true, cards: [...] } or { ok: false, error: "..." }.
  class ExtractCardsService
    MAX_TEXT_LENGTH = 12_000
    MAX_TOKENS      = 2048

    PROMPT = <<~PROMPT
      You are an English learning assistant. Analyze this conversation and extract the most valuable items for the learner to review.

      Extract up to 20 cards in three categories:
      - "vocabulary": new words or expressions (including phrasal verbs, idioms, collocations)
      - "mistake": errors the learner made + the correct version
      - "phrase": useful sentence structures or chunks the learner can reuse

      Return ONLY a valid JSON array. Each object must have:
      - "card_type": "vocabulary" | "mistake" | "phrase"
      - "front": the word / the mistake / the phrase (short, as written by the learner or as a prompt)
      - "back": meaning / correction / what to say instead (clear, concise)
      - "example": one natural example sentence (required for vocabulary and phrase; optional for mistake)

      Rules:
      - Prioritize items with the highest learning value
      - For mistakes, "front" is what was wrong and "back" is the correct form + brief explanation
      - Keep "front" and "back" short (≤ 20 words each)
      - Example must be a real, natural English sentence
      - Return [] if nothing valuable is found

      CONVERSATION:
      %{conversation}
    PROMPT

    def initialize(session:, text:)
      @session = session
      @text    = text.to_s.slice(0, MAX_TEXT_LENGTH)
    end

    def call
      prompt   = PROMPT % { conversation: @text }
      client   = Coaching::AnthropicClient.new('ExtractCardsService')
      raw      = client.complete(prompt: prompt, max_tokens: MAX_TOKENS, account_id: nil)

      return { ok: false, error: 'Claude não respondeu' } if raw.blank?

      cards_data = parse_json(raw)
      return { ok: false, error: 'Resposta inesperada do Claude' } if cards_data.nil?

      cards = create_cards(cards_data)
      { ok: true, cards: cards }
    rescue StandardError => e
      Rails.logger.error "[English::ExtractCardsService] #{e.class}: #{e.message}"
      { ok: false, error: e.message }
    end

    private

    def parse_json(raw)
      # Claude sometimes wraps JSON in markdown fences
      json_str = raw.match(/```(?:json)?\s*(\[.*?\])\s*```/m)&.[](1) || raw
      # Try to find the array if there's extra text
      json_str = json_str.match(/(\[.*\])/m)&.[](1) || json_str
      JSON.parse(json_str)
    rescue JSON::ParserError
      nil
    end

    def create_cards(cards_data)
      cards_data.filter_map do |c|
        next unless c['card_type'].in?(%w[vocabulary mistake phrase])
        next if c['front'].blank? || c['back'].blank?

        EnglishCard.create!(
          user:            @session.user,
          english_session: @session,
          card_type:       c['card_type'],
          front:           c['front'].strip,
          back:            c['back'].strip,
          example:         c['example']&.strip,
          status:          'learning',
          next_review_at:  Time.current
        )
      end
    end
  end
end
