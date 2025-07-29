# frozen_string_literal: true

class Ability
  include CanCan::Ability

  def initialize(user)
    check_user_abilities(user:)
    #
    # The first argument to `can` is the action you are giving the user
    # permission to do.
    # If you pass :manage it will apply to every action. Other common actions
    # here are :read, :create, :update and :destroy.
    #
    # The second argument is the resource the user can perform the action on.
    # If you pass :all it will apply to every resource. Otherwise pass a Ruby
    # class of the resource.
    #
    # The third argument is an optional hash of conditions to further filter the
    # objects.
    # For example, here the user can only update published articles.
    #
    #   can :update, Article, published: true
    #
    # See the wiki for details:
    # https://github.com/CanCanCommunity/cancancan/blob/develop/docs/define_check_abilities.md
  end

  private

  def check_user_abilities(user:)
    # Define abilities for the user here. For example:
    return cannot :manage, :all if user.blank?

    # Recupera o account_user para pegar o ROLE do usuário da conta
    account_user = user.current_account_user
    return cannot :manage, :all if account_user.blank?

    # Se for admin ou dono da conta
    return ability_for_admin_or_owner(user:) if user.admin? || user.current_account_owner? || account_user.admin?

    if user.account.business?
      if account_user.custom?
        ability_for_account_settings(user:)
        ability_for_contacts(user:)
        ability_for_graphs_contacts(user:)
        ability_for_categories(user:)
        ability_for_cost_centers(user:)
        ability_for_bank_accounts(user:)
        ability_for_account_users(user:)
        ability_for_invitations(user:)
        ability_for_imports(user:)
        ability_for_balance(user:)
        ability_for_outcome(user:)
        ability_for_revenue(user:)
        ability_for_expense(user:)
        ability_for_totalizer(user:)
        ability_for_home(user:)
        ability_for_billing(user:)
        ability_for_transactions(user:)
        ability_for_files(user:)
        ability_for_exports(user:)
        ability_for_notifications(user:)
        ability_for_advanced_search(user:)
        ability_for_statements(user:)
        ability_for_receipts(user:)
        ability_for_document_templates(user:)
        # ability_for_receipts_templates(user:)
        ability_for_reports(user:)
        ability_for_invoices(user:)
        ability_for_services(user:)
        ability_for_company_nfse_configs(user:)
      else
        cannot :manager, :all
      end

      # Cannot remove the current logged user or owner's account
      cannot :destroy, AccountUser, { user: }
      cannot :destroy, AccountUser, { user: user.account.owner }

    # Se for conta (Personal)
    else
      if user.account.enabled?
        can :manage, :all
      else
        can :read, :all
        can :manage, :billing
      end

      # Remove access for members and account invitation if account is personal
      cannot :manage, AccountUser
      cannot :manage, AccountInvitation
      cannot :manage, Invoice
    end

    cannot :destroy, BankAccount, &:in_use?
    cannot :destroy, BankAccount, &:default?
  end

  def ability_for_admin_or_owner(user:)
    if user.account.enabled?
      can :manage, :all
      cannot :destroy, AccountUser, { user: }
      cannot :destroy, AccountUser, { user: user.account.owner }
      cannot :destroy, BankAccount, &:in_use?
      cannot :destroy, BankAccount, &:default?
      return if user.account.can_add_user?

      cannot :create, AccountInvitation
    else
      can :read, :all
      can :create, :exports
      can :manage, :billing
      can :manage, :account_settings
    end

    return if user.account.business?

    # Remove access for members and account invitation if account is personal
    cannot :manage, AccountUser
    cannot :manage, AccountInvitation
    cannot :manage, Invoice
    cannot :manage, Service
    cannot :manage, CompanyNfseConfig
  end

  def ability_for_transactions(user:)
    can :read, Transaction do |transaction|
      user.policy?(:transactions, transaction.transaction_type.to_s.pluralize.to_sym, :read)
    end

    if user.policy?(:transactions, :fixed_expenses, :read) &&
       user.policy?(:transactions, :variable_expenses, :read) &&
       user.policy?(:transactions, :payrolls, :read) &&
       user.policy?(:transactions, :taxes, :read)
      can :read, :all_expenses
    end

    return unless user.account.enabled?

    can :destroy, Transaction do |transaction|
      user.policy?(:transactions, transaction.transaction_type.to_s.pluralize.to_sym, :destroy)
    end

    can :update, Transaction do |transaction|
      user.policy?(:transactions, transaction.transaction_type.to_s.pluralize.to_sym, :update)
    end

    can :create, Transaction do |transaction|
      user.policy?(:transactions, transaction.transaction_type.to_s.pluralize.to_sym, :create)
    end

    # Can read if exists any transactions read permission
    # Transaction.transaction_types.each do |transaction_type|
    #   can :read, Transaction if user.policy?(:transactions, transaction_type.first.pluralize.to_sym, :read)
    # end
  end

  def ability_for_contacts(user:)
    can :read,    Contact if user.policy?(:contacts, :read)

    return unless user.account.enabled?

    can :create,  Contact if user.policy?(:contacts, :create)
    can :update,  Contact if user.policy?(:contacts, :update)
    can :destroy, Contact if user.policy?(:contacts, :destroy)
  end

  def ability_for_graphs_contacts(user:)
    can :read, :graphs if user.policy?(:graphs, :read)
  end

  def ability_for_cost_centers(user:)
    can :read,    CostCenter if user.policy?(:cost_centers, :read)

    return unless user.account.enabled?

    can :create,  CostCenter if user.policy?(:cost_centers, :create)
    can :update,  CostCenter if user.policy?(:cost_centers, :update)
    can :destroy, CostCenter if user.policy?(:cost_centers, :destroy)
  end

  def ability_for_categories(user:)
    can :read,    Category if user.policy?(:categories, :read)

    return unless user.account.enabled?

    can :create,  Category if user.policy?(:categories, :create)
    can :update,  Category if user.policy?(:categories, :update)
    can :destroy, Category if user.policy?(:categories, :destroy)
  end

  def ability_for_bank_accounts(user:)
    can :read,    BankAccount if user.policy?(:bank_accounts, :read)

    return unless user.account.enabled?

    can :create,  BankAccount if user.policy?(:bank_accounts, :create)
    can :update,  BankAccount if user.policy?(:bank_accounts, :update)
    can :destroy, BankAccount if user.policy?(:bank_accounts, :destroy)

    cannot :destroy, BankAccount, &:in_use?
    cannot :destroy, BankAccount, &:default?
  end

  # @param [User] user
  # Conciliação Bancária (Extrato OFX)
  def ability_for_statements(user:)
    can :read,    Statement if user.policy?(:statements, :read)

    return unless user.account.enabled?

    can :create,  Statement if user.policy?(:statements, :create)
    can :update,  Statement if user.policy?(:statements, :update)
    can :destroy, Statement if user.policy?(:statements, :destroy)
  end

  def ability_for_account_users(user:)
    can :read,    AccountUser if user.policy?(:account_users, :read)

    return unless user.account.enabled?

    can :update,  AccountUser if user.policy?(:account_users, :update)
    can :destroy, AccountUser if user.policy?(:account_users, :destroy)
  end

  def ability_for_invitations(user:)
    can :read,    AccountInvitation if user.policy?(:account_users, :account_invitations, :read)

    return unless user.account.enabled?

    can :create,  AccountInvitation if user.policy?(:account_users, :account_invitations, :create) && user.account.can_add_user?
    can :destroy, AccountInvitation if user.policy?(:account_users, :account_invitations, :destroy)
  end

  def ability_for_permissions(user:)
    return unless user.account.enabled?

    can :manage,  :permissions if user.policy?(:account_users, :permissions, :manage)
  end

  def ability_for_imports(user:)
    can :read,    Import if user.policy?(:imports, :read)

    return unless user.account.enabled?

    can :create,  Import if user.policy?(:imports, :create)
    can :destroy, Import, &:able_to_destroy? if user.policy?(:imports, :destroy)
    can :discard, Import, &:able_to_discard? if user.policy?(:imports, :destroy)
  end

  def ability_for_account_settings(user:)
    return unless user.account.enabled?

    can :manage, :account_settings if user.policy?(:account_settings, :manage)
  end

  def ability_for_balance(user:)
    can :read, :balance if user.policy?(:balances, :read)
  end

  def ability_for_outcome(user:)
    can :read, :outcome if user.policy?(:outcomes, :read)
  end

  def ability_for_revenue(user:)
    can :read, :revenue if user.policy?(:revenues, :read)
  end

  def ability_for_expense(user:)
    can :read, :expense if user.policy?(:expenses, :read)
  end

  def ability_for_totalizer(user:)
    can :read, :totalizer if user.policy?(:totalizer, :read)
  end

  def ability_for_reports(user:)
    can :read, :reports if user.policy?(:reports, :read)
  end

  def ability_for_home(user:)
    can :read, :home if user.policy?(:home, :read)
  end

  def ability_for_billing(user:)
    can :manage, :billing if user.policy?(:billing, :manage)
  end

  def ability_for_exports(user:)
    can :read, :exports if user.policy?(:exports, :read)

    return unless user.account.enabled?

    can :create, :exports if user.policy?(:exports, :create)
  end

  def ability_for_files(user:)
    can :read, :files if user.policy?(:files, :read)
    can :download, :files if user.policy?(:files, :download)

    return unless user.account.enabled?

    can :create, :files if user.policy?(:files, :create)
    can :destroy, :files if user.policy?(:files, :destroy)
  end

  def ability_for_receipts(user:)
    can :create, :receipts if user.policy?(:transactions, :receipts, :create)
  end

  def ability_for_document_templates(user:)
    can :read, DocumentTemplate if user.policy?(:document_templates, :read)
    can :create, DocumentTemplate if user.policy?(:document_templates, :create)
    can :update, DocumentTemplate if user.policy?(:document_templates, :update)
    can :destroy, DocumentTemplate if user.policy?(:document_templates, :destroy)
  end

  # def ability_for_receipts_templates(user:)
  #   can :read, ReceiptTemplate if user.policy?(:document_templates, :receipts, :read)
  #   can :create, ReceiptTemplate if user.policy?(:document_templates, :receipts, :create)
  #   can :update, ReceiptTemplate if user.policy?(:document_templates, :receipts, :update)
  #   can :destroy, ReceiptTemplate if user.policy?(:document_templates, :receipts, :destroy)
  # end

  def ability_for_notifications(user:)
    can :read, 'notifications.email' if user.policy?(:notifications, :email, :read)
  end

  def ability_for_advanced_search(user:)
    can :read, :advanced_search if user.policy?(:advanced_search, :read)
  end

  def ability_for_invoices(user:)
    return unless user.account.business?

    can :read, Invoice if user.policy?(:invoices, :read)

    return unless user.account.enabled?

    can :create,  Invoice if user.policy?(:invoices, :create)
    can :update,  Invoice if user.policy?(:invoices, :update)
    can :destroy, Invoice if user.policy?(:invoices, :destroy)
  end

  def ability_for_services(user:)
    return unless user.account.business?

    can :read, Service if user.policy?(:services, :read)

    return unless user.account.enabled?

    can :create,  Service if user.policy?(:services, :create)
    can :update,  Service if user.policy?(:services, :update)
    can :destroy, Service if user.policy?(:services, :destroy)
  end

  def ability_for_company_nfse_configs(user:)
    return unless user.account.business?
    return unless user.account.feature_enabled?(:nfse)

    can :update,  CompanyNfseConfig if user.policy?(:company_nfse_configs, :update)
  end
end
