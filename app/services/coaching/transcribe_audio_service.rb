# frozen_string_literal: true

module Coaching
  class TranscribeAudioService
    WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions'

    def initialize(audio_file)
      @audio_file = audio_file
    end

    def call
      uri = URI(WHISPER_URL)
      boundary = "OrbiBoundary#{SecureRandom.hex(16)}"

      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.read_timeout = 30

      request = Net::HTTP::Post.new(uri)
      request['Authorization'] = "Bearer #{ENV['OPENAI_API_KEY']}"
      request['Content-Type'] = "multipart/form-data; boundary=#{boundary}"
      request.body = build_multipart(boundary)

      response = http.request(request)

      unless response.is_a?(Net::HTTPSuccess)
        Rails.logger.error "[Coaching::TranscribeAudioService] API #{response.code}: #{response.body}"
        return nil
      end

      response.body.force_encoding('UTF-8').scrub.strip
    rescue => e
      Rails.logger.error "[Coaching::TranscribeAudioService] #{e.class}: #{e.message}"
      nil
    end

    private

    def build_multipart(boundary)
      crlf = "\r\n"
      body = (+"").force_encoding(Encoding::BINARY)

      [
        ['model',           'whisper-1'],
        ['language',        'pt'],
        ['response_format', 'text']
      ].each do |name, value|
        body << "--#{boundary}#{crlf}"
        body << "Content-Disposition: form-data; name=\"#{name}\"#{crlf}#{crlf}"
        body << "#{value}#{crlf}"
      end

      filename     = @audio_file.original_filename.presence || 'audio.webm'
      content_type = @audio_file.content_type.presence     || 'audio/webm'
      file_data    = @audio_file.read.force_encoding(Encoding::BINARY)

      body << "--#{boundary}#{crlf}"
      body << "Content-Disposition: form-data; name=\"file\"; filename=\"#{filename}\"#{crlf}"
      body << "Content-Type: #{content_type}#{crlf}#{crlf}"
      body << file_data
      body << crlf
      body << "--#{boundary}--#{crlf}"

      body
    end
  end
end
