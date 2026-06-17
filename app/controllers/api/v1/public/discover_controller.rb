# frozen_string_literal: true

module Api
  module V1
    module Public
      class DiscoverController < ActionController::API
        include ActiveStorage::SetCurrent
        PAGE_SIZE = 24

        before_action :require_platform_admin!, only: [:hide]

        CATEGORIES = %w[
          Psicólogo Advogado Nutricionista Personal\ Trainer Barbeiro Cabeleireiro
          Dentista Médico Fisioterapeuta Professor Coach Terapeuta
          Contador Veterinário Arquiteto Designer
        ].freeze

        def index
          accounts_query = base_query

          if params[:q].present?
            q = params[:q]
            accounts_query = accounts_query.where(
              "unaccent(people.first_name) ILIKE unaccent(:q) OR unaccent(people.last_name) ILIKE unaccent(:q) OR " \
              "unaccent(people.screen_name) ILIKE unaccent(:q) OR unaccent(accounts.profession_category) ILIKE unaccent(:q)",
              q: "%#{q}%"
            )
          end

          if params[:category].present?
            accounts_query = accounts_query.where(
              "unaccent(accounts.profession_category) ILIKE unaccent(?)", "%#{params[:category]}%"
            )
          end

          # Campo único "cidade ou bairro" — busca em city E district, sem exigir acento
          if params[:city].present?
            accounts_query = accounts_query.joins(
              "LEFT JOIN addresses ON addresses.addressable_id = people.id " \
              "AND addresses.addressable_type = 'Person'"
            )
            accounts_query = accounts_query.where(
              "unaccent(addresses.city) ILIKE unaccent(:loc) OR unaccent(addresses.district) ILIKE unaccent(:loc)",
              loc: "%#{params[:city]}%"
            )
          end

          # Busca por bounds (viewport do mapa) — sw/ne lat/lng
          if params[:sw_lat].present? && params[:ne_lat].present?
            accounts_query = accounts_query.joins(
              "LEFT JOIN addresses addr_b ON addr_b.addressable_id = people.id " \
              "AND addr_b.addressable_type = 'Person'"
            ).where(
              "addr_b.latitude IS NOT NULL AND addr_b.longitude IS NOT NULL AND " \
              "addr_b.latitude BETWEEN ? AND ? AND addr_b.longitude BETWEEN ? AND ?",
              params[:sw_lat].to_f, params[:ne_lat].to_f,
              params[:sw_lng].to_f, params[:ne_lng].to_f
            )
          end

          total      = accounts_query.distinct.count
          page       = [params[:page].to_i, 0].max
          has_logo   = "EXISTS(SELECT 1 FROM active_storage_attachments asa WHERE asa.record_type = 'Person' AND asa.record_id = people.id AND asa.name = 'logo')"
          ids        = accounts_query
                         .select("accounts.id, (#{has_logo}) AS has_logo")
                         .order(Arel.sql("has_logo DESC, accounts.id DESC"))
                         .distinct
                         .limit(PAGE_SIZE)
                         .offset(page * PAGE_SIZE)
                         .map(&:id)
          accounts   = Account.where(id: ids).includes(company: [:address, { logo_attachment: :blob }, { cover_image_attachment: :blob }], services: [], appointment_links: [])

          render json: { results: accounts.map { |a| card_json(a) }, total: total, page: page }
        rescue StandardError => e
          Rails.logger.error "Discover error: #{e.class}: #{e.message}"
          render json: { error: 'Erro interno do servidor' }, status: :internal_server_error
        end

        def show
          account = Account.includes(company: [:address, { logo_attachment: :blob }, { cover_image_attachment: :blob }], services: [], appointment_links: [])
                           .find_by(id: params[:id], directory_visible: true, suspended: false)
          return render json: { error: 'Profissional não encontrado' }, status: :not_found unless account

          account.increment!(:profile_views)
          render json: profile_json(account)
        rescue StandardError => e
          Rails.logger.error "Discover error: #{e.class}: #{e.message}"
          render json: { error: 'Erro interno do servidor' }, status: :internal_server_error
        end

        def hide
          account = Account.find_by(id: params[:id])
          return render json: { error: 'Não encontrado' }, status: :not_found unless account

          account.update_column(:directory_visible, false)
          render json: { ok: true, id: account.id }
        rescue StandardError => e
          render json: { error: e.message }, status: :internal_server_error
        end

        def categories
          render json: { categories: CATEGORIES }
        end

        private

        def require_platform_admin!
          token = request.headers['Authorization']&.sub(/\ABearer\s+/i, '')
          return render json: { error: 'Unauthorized' }, status: :unauthorized unless token

          user = begin
            decoded = JSON.parse(Base64.strict_decode64(token))
            exp = decoded['exp']
            return render json: { error: 'Token expirado' }, status: :unauthorized if exp && Time.current.to_i > exp
            User.find_by(id: decoded['user_id'])
          rescue
            nil
          end

          render json: { error: 'Forbidden' }, status: :forbidden unless user&.admin?
        end

        def base_query
          Account
            .joins(:company)
            .where(directory_visible: true, suspended: false)
            .where(discarded_at: nil)
        end

        def card_json(account)
          company = account.company
          address = company&.address
          token   = account.appointment_links.find { |al| al.active }&.token

          {
            id:                  account.id,
            name:                display_name(company),
            profession_category: account.profession_category,
            description:         account.directory_description,
            logo_url:            logo_url_for(company),
            cover_url:           cover_url_for(company),
            location: {
              city:      address&.city,
              district:  address&.district,
              state:     address&.state,
              latitude:  address&.latitude,
              longitude: address&.longitude
            },
            ratings_average:   account.preferences['ratings_average'],
            ratings_count:     account.preferences['ratings_count'],
            patients_count:    account.preferences['patients_count'],
            crn_verified:      account.professional_registration.present?,
            specialties:       account.specialties.presence || [],
            instagram_url:     account.instagram_url,
            services_count:    account.services.size,
            services_preview:  account.services.first(3).map { |s|
              { name: s.name, price_cents: s.selling_price_cents }
            },
            booking_token: token
          }
        end

        def profile_json(account)
          company = account.company
          address = company&.address
          token   = account.appointment_links.find { |al| al.active }&.token

          {
            id:                  account.id,
            name:                display_name(company),
            legal_name:          company&.name,
            profession_category: account.profession_category,
            description:         account.directory_description,
            logo_url:            logo_url_for(company),
            cover_url:           cover_url_for(company),
            email:               company&.email,
            phone:               company&.cell_phone_number.presence || company&.phone_number,
            location: {
              city:          address&.city,
              district:      address&.district,
              state:         address&.state,
              postcode:      address&.postcode,
              address_line1: address&.address_line1,
              latitude:      address&.latitude,
              longitude:     address&.longitude
            },
            specialties:               account.specialties.presence || [],
            instagram_url:             account.instagram_url,
            professional_registration: account.professional_registration,
            services: account.services.map { |s|
              {
                id:               s.id,
                name:             s.name,
                description:      s.description,
                price_cents:      s.selling_price_cents,
                duration_minutes: s.metadata&.dig('duration_minutes')&.to_i || 60,
                modality:         s.metadata&.dig('modality') || 'presencial'
              }
            },
            booking_token: token
          }
        end

        def logo_url_for(company)
          return nil unless company&.logo&.attached?
          rails_blob_url(company.logo)
        rescue StandardError => e
          Rails.logger.error "[DiscoverController] logo_url_for failed for company #{company&.id}: #{e.message}"
          nil
        end

        def cover_url_for(company)
          return nil unless company&.cover_image&.attached?
          rails_blob_url(company.cover_image)
        rescue StandardError => e
          Rails.logger.error "[DiscoverController] cover_url_for failed for company #{company&.id}: #{e.message}"
          nil
        end

        def display_name(company)
          return '' unless company

          company.screen_name.presence || "#{company.first_name} #{company.last_name}".strip
        end
      end
    end
  end
end
