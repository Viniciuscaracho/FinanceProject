class CollapsedMenuController < ApplicationController
    before_action :set_current_user

    def update
        @current_user.collapsed_menu = params[:collapsed_menu]
        @current_user.save
    end

    private
    	
    def set_current_user
        @current_user = Current.account.users.find(params[:id])
    end
end