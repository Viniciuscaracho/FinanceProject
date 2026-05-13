# frozen_string_literal: true

module Api
  module V1
    class UsersController < Api::BaseController

      def index
        users = Current.account.users
        number_of_items = [params.fetch(:items, 25).to_i, 50].max
        _pagy, paginated_users = pagy(users, items: number_of_items)
        render json: { users: paginated_users.map { |u| user_json(u) } }
      end

      def show
        @user = Current.account.users.find(params[:id])
        render json: { user: user_json(@user) }
      end

      def update
        @user = Current.account.users.find(params[:id])
        @user.update!(user_params)

        render json: { user: user_json(@user) }, status: :ok
      end

      private

      def user_params
        params.permit(:name, :email, :first_name, :last_name, :password)
      end

      def user_json(user)
        { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, name: user.name }
      end
    end
  end
end
