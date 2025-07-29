# frozen_string_literal: true

class PdfBuilder < ApplicationService
  def call
    absolute_html = Grover::HTMLPreprocessor.process(context.html, "#{context.base_url}/", context.protocol)
    context.pdf = Grover.new(absolute_html, **grover_options).to_pdf
  end

  private

  def grover_options
    {
      format: 'A4',
      margin: { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' },
      emulate_media: 'screen',
      launch_args:
    }.merge(context.options.presence || {})
  end

  def launch_args
    ENV['PUPPETEER_LAUNCH_ARGS']&.split(',') || %w[--no-sandbox --disable-setuid-sandbox --font-render-hinting=medium --headless=true]
  end
end
