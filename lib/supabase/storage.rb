# frozen_string_literal: true

module Supabase
  module Storage
    # Upload de arquivo para Supabase Storage
    def self.upload(bucket, path, file, options = {})
      supabase_url = Rails.application.config.supabase[:url]
      service_role_key = Rails.application.config.supabase[:service_role_key]
      
      return { error: 'Supabase não configurado' } unless supabase_url.present? && service_role_key.present?
      
      begin
        uri = URI("#{supabase_url}/storage/v1/object/#{bucket}/#{path}")
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true
        
        request = Net::HTTP::Post.new(uri)
        request['Authorization'] = "Bearer #{service_role_key}"
        request['Content-Type'] = file.content_type || 'application/octet-stream'
        request['x-upsert'] = options[:upsert] ? 'true' : 'false'
        request.body = file.read
        
        response = http.request(request)
        
        if response.code.to_i == 200
          { success: true, url: "#{supabase_url}/storage/v1/object/public/#{bucket}/#{path}" }
        else
          { error: "Erro ao fazer upload: #{response.body}" }
        end
      rescue => e
        { error: "Erro na comunicação com Supabase: #{e.message}" }
      end
    end
    
    # Download de arquivo do Supabase Storage
    def self.download(bucket, path)
      supabase_url = Rails.application.config.supabase[:url]
      service_role_key = Rails.application.config.supabase[:service_role_key]
      
      return { error: 'Supabase não configurado' } unless supabase_url.present? && service_role_key.present?
      
      begin
        uri = URI("#{supabase_url}/storage/v1/object/#{bucket}/#{path}")
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true
        
        request = Net::HTTP::Get.new(uri)
        request['Authorization'] = "Bearer #{service_role_key}"
        
        response = http.request(request)
        
        if response.code.to_i == 200
          { success: true, data: response.body }
        else
          { error: "Erro ao fazer download: #{response.body}" }
        end
      rescue => e
        { error: "Erro na comunicação com Supabase: #{e.message}" }
      end
    end
    
    # Deletar arquivo do Supabase Storage
    def self.delete(bucket, path)
      supabase_url = Rails.application.config.supabase[:url]
      service_role_key = Rails.application.config.supabase[:service_role_key]
      
      return { error: 'Supabase não configurado' } unless supabase_url.present? && service_role_key.present?
      
      begin
        uri = URI("#{supabase_url}/storage/v1/object/#{bucket}/#{path}")
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true
        
        request = Net::HTTP::Delete.new(uri)
        request['Authorization'] = "Bearer #{service_role_key}"
        
        response = http.request(request)
        
        if response.code.to_i == 200
          { success: true }
        else
          { error: "Erro ao deletar: #{response.body}" }
        end
      rescue => e
        { error: "Erro na comunicação com Supabase: #{e.message}" }
      end
    end
    
    # Obter URL pública do arquivo
    def self.public_url(bucket, path)
      supabase_url = Rails.application.config.supabase[:url]
      "#{supabase_url}/storage/v1/object/public/#{bucket}/#{path}"
    end
  end
end

