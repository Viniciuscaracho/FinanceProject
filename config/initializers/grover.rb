# frozen_string_literal: true

# config/initializers/grover.rb
Grover.configure do |config|
  config.use_png_middleware  = true
  config.use_jpeg_middleware = true
  config.use_pdf_middleware  = true
  config.root_url = "#{ENV.fetch('DEFAULT_HOST_PROTOCOL', 'http')}://#{ENV.fetch('DEFAULT_HOST_NAME', 'localhost:3000')}"
  config.options = {
    format: 'A4',
    margin: {
      top: '1cm',
      bottom: '1cm',
      left: '1cm',
      right: '1cm'
    },
    emulate_media: 'screen'
    # emulate_media: 'screen',
    # display_url: 'http://localhost:3000/',
    # scale: 0.9
  }
end
