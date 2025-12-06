# frozen_string_literal: true

namespace :db do
  desc "Cria dados de demonstração para todas as funcionalidades do sistema"
  task demo_data: :environment do
    puts "\n🚀 Iniciando criação de dados de demonstração..."
    load Rails.root.join('db', 'seeds', 'demo_data.rb')
  end

  desc "Reseta o banco e cria todos os dados (básicos + demo)"
  task reset_with_demo: :environment do
    puts "\n⚠️  ATENÇÃO: Isso vai apagar todos os dados existentes!"
    puts "Pressione Ctrl+C para cancelar ou Enter para continuar..."
    STDIN.gets
    
    Rake::Task['db:reset'].invoke
    Rake::Task['db:demo_data'].invoke
    
    puts "\n✅ Banco de dados resetado e dados de demonstração criados!"
  end
end

