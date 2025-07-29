# frozen_string_literal: true

module Api
  module V1
    class UsersController < Api::BaseController

      def index
        users = Current.account.users

        number_of_items = [params.fetch(:items, 25).to_i, 50].max
        @pagy, @users = pagy(users, items: number_of_items)
      end

      def show
        @user = Current.account.users.find(params[:id])
      end

      def update
        @user = Current.account.users.find(params[:id])
        @user.update!(user_params)

        render :show, status: :ok
      end

      private

      def user_params
        params.permit(:name, :email, :password)
      end
    end
  end
end
