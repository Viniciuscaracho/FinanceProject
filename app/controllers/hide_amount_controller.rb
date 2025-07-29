class HideAmountController < ApplicationController
  before_action :set_current_user

  def index; end

  def toggle_visible
    current_user.visible_amount = !current_user.visible_amount
    current_user.save
  end

  private

  def set_current_user
    @current_user = current_user
  end
end
