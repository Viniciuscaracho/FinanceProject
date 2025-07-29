# frozen_string_literal: true

Rails.application.routes.draw do
  default_url_options host: ENV.fetch('DEFAULT_HOST_NAME', 'localhost:3000')

  # Health check endpoint
  get '/health_check' => 'health_check#index'

  draw :cdn

  devise_for :users, controllers: {
    registrations: 'users/registrations',
    invitations: 'users/invitations',
    confirmations: 'users/confirmations'
  }

  if ENV['SIDEKIQ_SERVER'].present? || Rails.env.test?
    draw :web
    draw :api
  elsif ENV['API_ONLY'].present?
    draw :api
  else
    draw :api  # Sempre carregar a API em desenvolvimento
    draw :web
  end
end
