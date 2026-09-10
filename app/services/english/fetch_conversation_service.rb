# frozen_string_literal: true

module English
  # Fetches a public ChatGPT share URL and extracts the conversation text.
  # Returns { ok: true, text: "..." } or { ok: false, error: "..." }.
  class FetchConversationService
    USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' \
                 '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    TIMEOUT = 15

    def initialize(url)
      @url = url.to_s.strip
    end

    def call
      return { ok: false, error: 'URL inválida' } unless valid_chatgpt_url?

      response = HTTParty.get(
        @url,
        timeout:      TIMEOUT,
        open_timeout: 10,
        headers: {
          'User-Agent' => USER_AGENT,
          'Accept'     => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        follow_redirects: true
      )

      unless response.success?
        return { ok: false, error: "HTTP #{response.code}" }
      end

      text = extract_text(response.body)

      if text.blank?
        return { ok: false, error: 'Não foi possível extrair o conteúdo. Cole o texto da conversa manualmente.' }
      end

      { ok: true, text: text }
    rescue StandardError => e
      Rails.logger.error "[English::FetchConversationService] #{e.class}: #{e.message}"
      { ok: false, error: 'Erro ao buscar a URL. Cole o texto manualmente.' }
    end

    private

    def valid_chatgpt_url?
      uri = URI.parse(@url)
      uri.host&.include?('chatgpt.com') && uri.path.start_with?('/share/')
    rescue URI::InvalidURIError
      false
    end

    def extract_text(html)
      doc = Nokogiri::HTML(html)

      # Remove scripts, styles, nav elements
      doc.css('script, style, nav, header, footer').remove

      # ChatGPT share pages render conversation turns in article/div[data-message-author-role]
      # Try structured extraction first
      messages = doc.css('[data-message-author-role]')
      if messages.any?
        return messages.map { |el|
          role = el['data-message-author-role']
          text = el.css('.markdown, p, .whitespace-pre-wrap').map(&:text).join(' ').strip
          text = el.text.strip if text.blank?
          "#{role.upcase}: #{text}"
        }.reject { |t| t.gsub(/[A-Z]+: /, '').blank? }.join("\n\n")
      end

      # Fallback: grab all visible text from main content area
      main = doc.css('main, article, [role="main"]').first || doc.css('body').first
      return '' unless main

      main.text.gsub(/\s+/, ' ').strip
    end
  end
end
