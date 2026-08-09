# frozen_string_literal: true

# rake credentials:add_google
# Adiciona google.client_id e google.client_secret às credentials criptografadas
# do ambiente atual, lendo os valores das variáveis de ambiente GOOGLE_CLIENT_ID
# e GOOGLE_CLIENT_SECRET.
#
# Uso (staging):
#   RAILS_ENV=staging \
#   GOOGLE_CLIENT_ID=... \
#   GOOGLE_CLIENT_SECRET=... \
#   bundle exec rake credentials:add_google
namespace :credentials do
  desc "Adiciona Google OAuth client_id e client_secret nas credentials Rails"
  task add_google: :environment do
    cid    = ENV.fetch('GOOGLE_CLIENT_ID')  { abort "❌  GOOGLE_CLIENT_ID não definido" }
    secret = ENV.fetch('GOOGLE_CLIENT_SECRET') { abort "❌  GOOGLE_CLIENT_SECRET não definido" }

    current_yaml = Rails.application.credentials.read
    config = YAML.safe_load(current_yaml, permitted_classes: [Symbol]) || {}
    config['google'] = { 'client_id' => cid, 'client_secret' => secret }

    Rails.application.credentials.write(config.to_yaml)
    puts "✅  google.client_id e google.client_secret gravados em #{Rails.env} credentials"
    puts "    Faça deploy ou reinicie o servidor para aplicar."
  end
end
