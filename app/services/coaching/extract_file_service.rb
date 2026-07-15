# frozen_string_literal: true

require 'open3'

module Coaching
  class ExtractFileService
    SUPPORTED_CONTENT_TYPES = %w[
      application/pdf
      application/vnd.openxmlformats-officedocument.wordprocessingml.document
      text/plain
    ].freeze

    EXTENSION_MAP = {
      '.pdf'  => 'application/pdf',
      '.docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt'  => 'text/plain'
    }.freeze

    def initialize(file)
      @file = file
    end

    def call
      case resolved_content_type
      when 'application/pdf'                                                                           then extract_pdf
      when 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' then extract_docx
      when 'text/plain'                                                                then extract_txt
      else
        Rails.logger.warn "[Coaching::ExtractFileService] Tipo não suportado: #{resolved_content_type}"
        nil
      end
    end

    def self.supported?(content_type, filename = nil)
      ct = content_type.to_s.split(';').first.to_s.strip
      return true if SUPPORTED_CONTENT_TYPES.include?(ct)

      ext = File.extname(filename.to_s).downcase
      EXTENSION_MAP.key?(ext)
    end

    private

    def resolved_content_type
      @resolved_content_type ||= begin
        ct = @file.content_type.to_s.split(';').first.strip
        if ct.blank? || ct == 'application/octet-stream'
          ext = File.extname(@file.original_filename.to_s).downcase
          ct  = EXTENSION_MAP[ext] || ct
        end
        ct
      end
    end

    def extract_pdf
      data = @file.read
      stdout, _stderr, status = Open3.capture3('pdftotext', '-', '-', stdin_data: data, binmode: true)
      return nil unless status.success?

      stdout.strip.presence
    rescue => e
      Rails.logger.error "[Coaching::ExtractFileService] PDF: #{e.class}: #{e.message}"
      nil
    end

    def extract_docx
      data = @file.read
      texts = []

      Zip::File.open_buffer(StringIO.new(data)) do |zip|
        entry = zip.find_entry('word/document.xml')
        return nil unless entry

        xml = entry.get_input_stream.read
        doc = Nokogiri::XML(xml)
        doc.remove_namespaces!
        texts = doc.xpath('//t').map(&:text)
      end

      texts.join(' ').gsub(/\s+/, ' ').strip.presence
    rescue => e
      Rails.logger.error "[Coaching::ExtractFileService] DOCX: #{e.class}: #{e.message}"
      nil
    end

    def extract_txt
      @file.read.force_encoding('UTF-8').scrub.strip.presence
    rescue => e
      Rails.logger.error "[Coaching::ExtractFileService] TXT: #{e.class}: #{e.message}"
      nil
    end
  end
end
