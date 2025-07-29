# frozen_string_literal: true

module Users
  module Permissions
    extend ActiveSupport::Concern

    included do
      delegate :can?, :cannot?, to: :ability
    end

    def ability
      @ability ||= Ability.new(self)
    end

    def is?(role)
      role = role.to_sym unless role.is_a?(Symbol)
      return false if current_account_user.blank?

      current_account_user.role == role
    end

    def policy?(*args)
      account_user = current_account_user
      return false if account_user.blank?
      return true if account_user.admin?

      policies = if account_user.policies.any?
                   account_user.policies
                 else
                   AccountUser::DEFAULT_POLICIES
                 end

      policies.include?(args.join('.'))
    end

    def all_policies?(list_of_policies = [])
      list_of_policies.all? { |policy| policies.include?(policy) }
    end

    def any_policies?(list_of_policies = [])
      list_of_policies.any? { |policy| policies.include?(policy) }
    end
  end
end
