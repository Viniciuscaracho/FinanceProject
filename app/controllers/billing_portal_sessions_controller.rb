# frozen_string_literal: true

class BillingPortalSessionsController < ApplicationController
  def create
    account = if params[:account_id].present?
                Current.user.accounts.find(params[:account_id])
              else
                Current.account
              end
    result = Billing::CreateBillingPortalSession.call(account:, user: Current.user)
    redirect_to result.session.url, allow_other_host: true, status: :see_other
  end
end
