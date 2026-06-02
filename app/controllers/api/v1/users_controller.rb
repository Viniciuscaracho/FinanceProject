# frozen_string_literal: true

module Api
  module V1
    class UsersController < Api::V1::ApplicationController
      include Pagy::Backend

      def index
        users = Current.account.users
        number_of_items = [params.fetch(:items, 25).to_i, 50].max
        _pagy, paginated_users = pagy(users, items: number_of_items)
        render json: { users: paginated_users.map { |u| user_json(u) } }
      end

      def show
        @user = Current.account&.users&.find_by(id: params[:id]) || User.find(params[:id])
        render json: { user: user_json(@user) }
      end

      def update
        @user = User.find(params[:id])
        render json: { error: 'Forbidden' }, status: :forbidden and return unless @user == current_user || current_user&.admin?
        @user.update!(user_params)

        render json: { user: user_json(@user) }, status: :ok
      end

      private

      def user_params
        permitted = params.permit(:name, :email, :first_name, :last_name, :password, :phone, :phone_number)
        permitted[:phone_number] = permitted.delete(:phone) if permitted[:phone].present?
        permitted
      end

      def user_json(user)
        { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, name: user.name, phone_number: user.phone_number }
      end
    end
  end
end
