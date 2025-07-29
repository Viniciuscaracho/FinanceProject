# frozen_string_literal: true

source 'https://rubygems.org'
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby '~> 3.1'

# Bundle edge Rails instead: gem "rails", github: "rails/rails", branch: "main"
gem 'rails', '~> 7.0.8'

# The original asset pipeline for Rails [https://github.com/rails/sprockets-rails]
gem 'sprockets-rails', '~> 3.5.2'

# Use postgresql as the database for Active Record
gem 'pg', '~> 1.1'

# Use the Puma web server [https://github.com/puma/puma]
gem 'puma', '~> 6.4.0'

# Hotwire's SPA-like page accelerator [https://turbo.hotwired.dev]
gem 'turbo_power', '~> 0.6.2' # https://github.com/marcoroth/turbo_power-rails
gem 'turbo-rails', '~> 1.3.2'

# Hotwire's modest JavaScript framework [https://stimulus.hotwired.dev]
gem 'stimulus-rails', '~> 1.1.0'

# Build JSON APIs with ease [https://github.com/rails/jbuilder]
gem 'jbuilder', '~> 2.11.5'

# Helps json fast search and navigation
gem 'jsonpath'

# Use Redis adapter to run Action Cable in production
gem 'redis', '~> 4.0'

# Bundling
gem 'cssbundling-rails', '~> 1.4.1' # CSS bundling for Rails
gem 'jsbundling-rails', '~> 1.3.1' # Bundle and transpile JavaScript [

# Use Kredis to get higher-level data types in Redis [https://github.com/rails/kredis]
# gem "kredis"

# Use Active Model has_secure_password [https://guides.rubyonrails.org/active_model_basics.html#securepassword]
# gem "bcrypt", "~> 3.1.7"

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem 'tzinfo-data', platforms: %i[mingw mswin x64_mingw jruby]

# Reduces boot times through caching; required in config/boot.rb
gem 'bootsnap', '~> 1.13.0', require: false

# Use Active Storage variants [https://guides.rubyonrails.org/active_storage_overview.html#transforming-images]
gem 'image_processing', '~> 1.12.0'
gem 'sassc-rails', '~> 2.1.0'

# helps to parse any type of date
gem 'chronic'

group :development, :test do
  # See https://guides.rubyonrails.org/debugging_rails_applications.html#debugging-with-the-debug-gem
  gem 'annotate', '~> 3.2.0'
  gem 'bullet', '~> 7.0.1'
  gem 'debug', platforms: %i[mri mingw x64_mingw]
  gem 'rubocop', '~> 1.36.0', require: false
  gem 'rubocop-rails', '~> 2.16.0', require: false
end

group :development do
  # Use console on exceptions pages [https://github.com/rails/web-console]
  gem 'web-console', '~> 4.2.0'

  # Add speed badges [https://github.com/MiniProfiler/rack-mini-profiler]
  # gem "rack-mini-profiler"

  # Speed up commands on slow machines / big apps [https://github.com/rails/spring]
  # gem "spring"
end

group :test do
  # Use system testing [https://guides.rubyonrails.org/testing.html#system-testing]
  gem 'capybara', '~> 3.37.1'
  gem 'mocha', '~> 2.1'
  gem 'rails-controller-testing'
  gem 'selenium-webdriver', '~> 4.4.0'
  gem 'simplecov', '~> 0.22.0', require: false
  gem 'webdrivers', '~> 5.2.0'
end

gem 'activerecord-import', '~> 1.4'
gem 'activerecord_where_assoc', '~> 1.1'
gem 'active_storage_validations', '~> 1.1'
gem 'acts_as_list', '~> 1.0'
gem 'acts-as-taggable-on', '~> 9.0'
gem 'acts_as_tenant', '~> 0.5.2'
gem 'audited', '~> 5.0'
gem 'audited-activejob', '~> 0.0.5'
gem 'aws-sdk-s3', '~> 1.114'
gem 'axlsx_styler', '~> 1.1'
gem 'browser', '~> 5.3'
gem 'cancancan', '~> 3.4'
gem 'caxlsx', '~> 3.3'
gem 'caxlsx_rails', '~> 0.6.3'
gem 'chartkick', '~> 4.2'
gem 'city-state', github: 'felipevenancio/city-state', branch: 'main'
gem 'date_validator', '~> 0.12.0'
gem 'devise', '>= 4.7.1'
gem 'devise-i18n', '~> 1.9'
gem 'devise_invitable', '~> 2.0'
gem 'discard', '~> 1.2'
gem 'eu_central_bank', '~> 1.7'
gem 'faker', '~> 3.2'
gem 'groupdate', '~> 6.1'
gem 'grover', '~> 1.1'
gem 'haml-rails', '~> 2.0'
gem 'heroicon', '~> 1.0'
gem 'html2haml', '~> 2.3'
gem 'httparty', '~> 0.21.0'
gem 'inky-rb', '~> 1.4.2.0', require: 'inky'
gem 'inline_svg', '~> 1.8'
gem 'interactor-rails', '~> 2.2'
gem 'invisible_captcha', '~> 2.0'
gem 'ledermann-rails-settings', '~> 2.5'
gem 'local_time', '~> 2.1'
gem 'mailgun-ruby', '~> 1.2'
gem 'money-open-exchange-rates', '~> 1.4'
gem 'money-rails', '~>1.12'
gem 'name_of_person', '~> 1.0'
gem 'noticed', '~> 1.6'
gem 'ofx', github: 'felipevenancio/ofx', branch: 'main'
gem 'oj', '~> 3.16'
gem 'pagy', '~> 6.0.3'
gem 'pg_search', '~> 2.3'
gem 'prefixed_ids', '~> 1.2'
gem 'premailer-rails', '~> 1.12'
gem 'pretender', '~> 0.4.0'
gem 'rack-attack', '~> 6.6'
gem 'rack-cors', '~> 2.0'
gem 'rails_admin', '~> 3.0'
gem 'rails_cursor_pagination', '~> 0.3.0'
gem 'sentry-rails', '~> 5.11.0'
gem 'sentry-ruby', '~> 5.11.0'
gem 'sentry-sidekiq', '~> 5.11.0'
gem 'sequenced', '~> 4.0'
gem 'sidekiq', '~> 6.5'
gem 'sidekiq-scheduler', '~> 4.0'
gem 'simple_enum', github: 'anaice/simple_enum', branch: 'ruby-3-rails-6.1+'
gem 'simple_xlsx_reader', '~> 2.0'
gem 'sixarm_ruby_unaccent', '~> 1.2'
gem 'store_attribute', '~> 1.1'
gem 'stripe', '~> 11.7'
gem 'validates_cpf_cnpj', '~> 0.2.0'
gem 'vanilla_nested', '~> 1.7'
gem 'view_component', '~> 2.71'
gem 'wicked', '~> 2.0'
gem 'with_advisory_lock', '~> 5.0'
gem 'workflow-activerecord', '~> 6.0'

# OAuth Authentication
gem 'omniauth', '~> 2.1'
gem 'omniauth-google-oauth2', '~> 1.1'
gem 'omniauth-rails_csrf_protection', '~> 1.0'
gem 'jwt', '~> 2.7'
