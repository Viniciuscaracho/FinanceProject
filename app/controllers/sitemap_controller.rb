# frozen_string_literal: true

class SitemapController < ApplicationController
  skip_before_action :authenticate_user!
  skip_before_action :redirect_to_checkout_page

  def index
    @base_url = request.base_url
    @accounts = Account
      .joins(:company)
      .where(directory_visible: true, suspended: false)
      .where(discarded_at: nil)
      .select("accounts.id, accounts.updated_at")
      .order(updated_at: :desc)

    respond_to do |format|
      format.xml { render layout: false }
    end
  end
end
