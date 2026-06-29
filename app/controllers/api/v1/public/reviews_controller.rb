# frozen_string_literal: true

module Api
  module V1
    module Public
      class ReviewsController < ActionController::API
        ALLOWED_PARAMS = %i[reviewer_name reviewer_email rating comment].freeze

        # GET /api/v1/public/reviews/:account_id
        def index
          account = Account.find_by(id: params[:account_id], directory_visible: true)
          return render json: { error: 'Não encontrado' }, status: :not_found unless account

          reviews = account.reviews.approved.recent.limit(50)
          render json: {
            total:   account.reviews.approved.count,
            average: account.preferences['ratings_average'],
            reviews: reviews.map { |r| review_json(r) },
          }
        end

        # POST /api/v1/public/reviews/:account_id
        def create
          account = Account.find_by(id: params[:account_id], directory_visible: true)
          return render json: { error: 'Profissional não encontrado' }, status: :not_found unless account

          review = account.reviews.build(review_params)
          if review.save
            render json: { ok: true, review: review_json(review) }, status: :created
          else
            render json: { errors: review.errors.full_messages }, status: :unprocessable_entity
          end
        rescue StandardError => e
          render json: { error: e.message }, status: :internal_server_error
        end

        # GET /api/v1/public/reviews/profile/:id — info do profissional para o form
        def profile_for_review
          account = Account.includes(company: [{ logo_attachment: :blob }])
                           .find_by(id: params[:id], directory_visible: true)
          return render json: { error: 'Não encontrado' }, status: :not_found unless account

          company = account.company
          name    = company&.screen_name.presence || "#{company&.first_name} #{company&.last_name}".strip
          logo    = company&.logo&.attached? ? rails_blob_url(company.logo) : nil

          render json: {
            id:       account.id,
            name:     name,
            logo_url: logo,
            profession_category: account.profession_category,
            ratings_count:   account.preferences['ratings_count'].to_i,
            ratings_average: account.preferences['ratings_average'].to_f,
          }
        end

        private

        def review_params
          params.require(:review).permit(*ALLOWED_PARAMS)
        end

        def review_json(r)
          {
            id:             r.id,
            reviewer_name:  r.reviewer_name,
            rating:         r.rating,
            comment:        r.comment,
            created_at:     r.created_at.iso8601,
          }
        end
      end
    end
  end
end
