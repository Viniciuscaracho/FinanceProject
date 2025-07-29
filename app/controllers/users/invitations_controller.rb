# frozen_string_literal: true

module Users
  class InvitationsController < Devise::InvitationsController
    def edit
      account = resource.my_accounts.first
      account ||= resource.my_accounts.new
      account.account_users.new(user: resource, role: :admin)

      company = account.company
      company ||= account.build_company
      company.email = resource.email

      super
    end

    protected

    def accept_resource
      resource = resource_class.accept_invitation!(update_resource_params)
      return resource if resource.errors.any?

      resource.reload
      account = resource.my_accounts.first
      account.account_users.new(user: resource, role: :admin)
      account.save!

      resource
    end
  end
end
