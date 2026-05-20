# frozen_string_literal: true

namespace :foods do
  desc 'Seed TACO food database (safe to re-run — uses find_or_create_by)'
  task seed: :environment do
    load Rails.root.join('db/seeds/taco_foods.rb')
  end
end
