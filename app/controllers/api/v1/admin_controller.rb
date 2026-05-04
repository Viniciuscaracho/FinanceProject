# frozen_string_literal: true

module Api
  module V1
    class AdminController < ApplicationController
      before_action :authenticate_admin!, except: [:stop_impersonating]
      before_action :authenticate_admin_or_impersonating!, only: [:stop_impersonating]
      before_action :set_account, only: [:account_details, :update_account, :suspend_account, :activate_account, :account_subscriptions, :impersonate]
      before_action :set_subscription, only: [:subscription_details, :update_subscription, :cancel_subscription, :reactivate_subscription]

      def accounts
        per_page = [params[:per_page]&.to_i || 50, 200].min

        accounts = Account.includes(:owner, :company, :subscription)
                         .order(created_at: :desc)
                         .page(params[:page] || 1)
                         .per(per_page)

        accounts = accounts.where(account_type_cd: Account::ACCOUNT_TYPES[params[:account_type]&.to_sym]) if params[:account_type].present? && Account::ACCOUNT_TYPES[params[:account_type]&.to_sym]
        accounts = accounts.where(subscription_status: params[:subscription_status]) if params[:subscription_status].present?
        accounts = accounts.where(suspended: params[:suspended] == 'true') if params[:suspended].present?
        accounts = accounts.where(free: params[:free] == 'true') if params[:free].present?
        accounts = accounts.where(admin: params[:admin] == 'true') if params[:admin].present?

        if params[:search].present?
          search_term = "%#{params[:search]}%"
          accounts = accounts.joins(:company).where(
            "people.email ILIKE ? OR people.first_name ILIKE ? OR accounts.prefix_id ILIKE ?",
            search_term, search_term, search_term
          )
        end

        render json: {
          accounts: accounts.map { |account| account_json(account) },
          pagination: {
            current_page: accounts.current_page,
            per_page: per_page,
            total_pages: accounts.total_pages,
            total_count: accounts.total_count
          },
          summary: {
            total_accounts: Account.count,
            active_subscriptions: active_subscriptions_count,
            suspended_accounts: Account.where(suspended: true).count,
            free_accounts: Account.where(free: true).count
          }
        }
      rescue => e
        render json: {
          error: 'Internal Server Error',
          message: e.message
        }, status: :internal_server_error
      end

      def account_details
        render json: {
          account: detailed_account_json(@account),
          subscription: @account.subscription ? detailed_subscription_json(@account.subscription) : nil,
          users: @account.account_users.includes(:user).map { |au| user_json(au.user) },
          statistics: account_statistics(@account)
        }
      rescue => e
        render json: {
          error: 'Internal Server Error',
          message: e.message
        }, status: :internal_server_error
      end

      def update_account
        if @account.update(account_params)
          render json: { success: true, account: detailed_account_json(@account) }
        else
          render json: { success: false, errors: @account.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def suspend_account
        @account.update!(suspended: true)
        render json: {
          success: true,
          message: 'Conta suspensa com sucesso',
          account: detailed_account_json(@account)
        }
      end

      def activate_account
        @account.update!(suspended: false)
        render json: {
          success: true,
          message: 'Conta ativada com sucesso',
          account: detailed_account_json(@account)
        }
      end

      def account_subscriptions
        subscriptions = @account.subscriptions.order(created_at: :desc)

        render json: {
          account: {
            id: @account.id,
            prefix_id: @account.prefix_id,
            name: @account.name,
            email: @account.email
          },
          subscriptions: subscriptions.map { |sub| detailed_subscription_json(sub) }
        }
      end

      def subscriptions
        per_page = [params[:per_page]&.to_i || 50, 200].min

        subscriptions = Subscription.includes(:account, account: [:owner, :company])
                                   .order(created_at: :desc)
                                   .page(params[:page] || 1)
                                   .per(per_page)

        subscriptions = subscriptions.where(status: params[:status]) if params[:status].present?
        subscriptions = subscriptions.where(account_id: params[:account_id]) if params[:account_id].present?

        if params[:search].present?
          search_term = "%#{params[:search]}%"
          subscriptions = subscriptions.joins(account: :company).where(
            "people.email ILIKE ? OR people.first_name ILIKE ? OR accounts.prefix_id ILIKE ?",
            search_term, search_term, search_term
          )
        end

        render json: {
          subscriptions: subscriptions.map { |sub| detailed_subscription_json(sub) },
          pagination: {
            current_page: subscriptions.current_page,
            per_page: per_page,
            total_pages: subscriptions.total_pages,
            total_count: subscriptions.total_count
          },
          summary: {
            total_subscriptions: Subscription.count,
            active: active_subscriptions_count,
            canceled: Subscription.where(status: 'canceled').count,
            past_due: Subscription.where(status: 'past_due').count,
            trialing: Subscription.where(status: 'trialing').count
          }
        }
      rescue => e
        render json: {
          error: 'Internal Server Error',
          message: e.message
        }, status: :internal_server_error
      end

      def subscription_details
        render json: {
          subscription: detailed_subscription_json(@subscription),
          account: detailed_account_json(@subscription.account),
          invoices: @subscription.subscription_invoices.order(created_at: :desc).limit(10).map { |inv| invoice_json(inv) },
          charges: @subscription.subscription_charges.order(created_at: :desc).limit(10).map { |ch| charge_json(ch) }
        }
      end

      def create_subscription
        account = Account.find(params[:account_id])

        return render json: { error: 'plan_id é obrigatório' }, status: :bad_request unless params[:plan_id].present?

        BarberManagement::Stripe::Client.with_api_key do
          customer_id = account.processor_customer_id
          unless customer_id.present?
            customer = ::Stripe::Customer.create(
              email: account.email,
              name: account.name,
              metadata: {
                account_id: account.id,
                account_prefix_id: account.prefix_id
              }
            )
            account.update!(processor_customer_id: customer.id)
            customer_id = customer.id
          end

          stripe_subscription = ::Stripe::Subscription.create(
            customer: customer_id,
            items: [{ price: params[:plan_id] }],
            metadata: {
              account_id: account.id,
              account_prefix_id: account.prefix_id,
              created_by: 'admin',
              admin_user_id: Current.user.id
            }
          )

          subscription = account.subscriptions.find_or_initialize_by(processor_id: stripe_subscription.id)
          subscription.sync!(stripe_subscription)

          account.assign_subscription_attributes(subscription)
          account.save!

          render json: {
            success: true,
            message: 'Assinatura criada com sucesso',
            subscription: detailed_subscription_json(subscription),
            account: detailed_account_json(account)
          }
        end
      rescue StandardError => e
        render json: {
          success: false,
          error: 'Erro ao criar assinatura',
          message: e.message
        }, status: :internal_server_error
      end

      def update_subscription
        BarberManagement::Stripe::Client.with_api_key do
          stripe_subscription = ::Stripe::Subscription.retrieve(@subscription.processor_id)

          update_params = {}
          update_params[:cancel_at_period_end] = params[:cancel_at_period_end] if params[:cancel_at_period_end].present?

          if params[:plan_id].present?
            ::Stripe::Subscription.update(
              @subscription.processor_id,
              {
                items: [{
                  id: stripe_subscription.items.data[0].id,
                  price: params[:plan_id]
                }],
                proration_behavior: params[:proration_behavior] || 'create_prorations'
              }
            )
          elsif update_params.any?
            ::Stripe::Subscription.update(@subscription.processor_id, update_params)
          end

          updated_subscription = ::Stripe::Subscription.retrieve(@subscription.processor_id)
          @subscription.sync!(updated_subscription)

          @subscription.account.assign_subscription_attributes(@subscription)
          @subscription.account.save!

          render json: {
            success: true,
            message: 'Assinatura atualizada com sucesso',
            subscription: detailed_subscription_json(@subscription)
          }
        end
      rescue StandardError => e
        render json: {
          success: false,
          error: 'Erro ao atualizar assinatura',
          message: e.message
        }, status: :internal_server_error
      end

      def cancel_subscription
        cancel_immediately = params[:immediately] == 'true'

        BarberManagement::Stripe::Client.with_api_key do
          if cancel_immediately
            ::Stripe::Subscription.delete(@subscription.processor_id)
            @subscription.update!(status: :canceled)
          else
            stripe_subscription = ::Stripe::Subscription.update(
              @subscription.processor_id,
              { cancel_at_period_end: true }
            )
            @subscription.sync!(stripe_subscription)
          end

          render json: {
            success: true,
            message: cancel_immediately ? 'Assinatura cancelada imediatamente' : 'Assinatura será cancelada ao final do período',
            subscription: detailed_subscription_json(@subscription.reload)
          }
        end
      rescue StandardError => e
        render json: {
          success: false,
          error: 'Erro ao cancelar assinatura',
          message: e.message
        }, status: :internal_server_error
      end

      def reactivate_subscription
        BarberManagement::Stripe::Client.with_api_key do
          stripe_subscription = ::Stripe::Subscription.update(
            @subscription.processor_id,
            { cancel_at_period_end: false }
          )

          @subscription.sync!(stripe_subscription)

          render json: {
            success: true,
            message: 'Assinatura reativada com sucesso',
            subscription: detailed_subscription_json(@subscription)
          }
        end
      rescue StandardError => e
        render json: {
          success: false,
          error: 'Erro ao reativar assinatura',
          message: e.message
        }, status: :internal_server_error
      end

      def dashboard
        render json: {
          summary: {
            total_accounts: Account.count,
            total_users: User.count,
            total_subscriptions: Subscription.count,
            active_subscriptions: active_subscriptions_count,
            suspended_accounts: Account.where(suspended: true).count,
            free_accounts: Account.where(free: true).count,
            business_accounts: Account.business.count,
            personal_accounts: Account.personal.count
          },
          subscriptions_by_status: Subscription.group(:status).count,
          accounts_by_type: Account.group(:account_type_cd).count,
          recent_accounts: Account.includes(:owner, :company)
                                 .order(created_at: :desc)
                                 .limit(10)
                                 .map { |acc| account_json(acc) },
          recent_subscriptions: Subscription.includes(account: [:owner, :company])
                                           .order(created_at: :desc)
                                           .limit(10)
                                           .map { |sub| detailed_subscription_json(sub) }
        }
      rescue => e
        render json: {
          error: 'Internal Server Error',
          message: e.message
        }, status: :internal_server_error
      end

      def impersonate
        target_user = @account.owner || @account.account_users.joins(:user).where(role_cd: AccountUser::ROLES[:admin]).first&.user

        return render json: {
          error: 'Usuário não encontrado',
          message: 'Esta conta não possui um usuário associado'
        }, status: :not_found unless target_user

        admin_user = Current.user
        admin_account = Current.account

        token = Base64.strict_encode64({
          user_id: target_user.id,
          email: target_user.email,
          exp: 24.hours.from_now.to_i,
          impersonating: true,
          admin_user_id: admin_user.id,
          admin_account_id: admin_account.id
        }.to_json)

        render json: {
          success: true,
          user: user_data_for_impersonation(target_user),
          token: token,
          admin: {
            id: admin_user.id,
            email: admin_user.email,
            name: admin_user.name
          }
        }
      end

      def stop_impersonating
        token = request.headers['Authorization']&.gsub(/^Bearer /, '')

        return render json: { error: 'Token não fornecido' }, status: :unauthorized unless token

        decoded_token = JSON.parse(Base64.strict_decode64(token))

        unless decoded_token['impersonating'] && decoded_token['admin_user_id']
          return render json: { error: 'Não está em modo de suporte' }, status: :bad_request
        end

        admin_user = User.find_by(id: decoded_token['admin_user_id'])
        admin_account = Account.find_by(id: decoded_token['admin_account_id'])

        unless admin_user && admin_account
          return render json: { error: 'Admin original não encontrado' }, status: :not_found
        end

        new_token = Base64.strict_encode64({
          user_id: admin_user.id,
          email: admin_user.email,
          exp: 24.hours.from_now.to_i
        }.to_json)

        render json: {
          success: true,
          user: user_data_for_admin(admin_user),
          token: new_token
        }
      rescue JSON::ParserError, ArgumentError => e
        render json: { error: 'Token inválido' }, status: :unauthorized
      end

      private

      def active_subscriptions_count
        statuses = Subscription::ACCESS_GRANTING_STATUSES.map(&:to_s)
        Account.joins(:subscription).where(subscriptions: { status: statuses }).count
      rescue
        0
      end

      def user_data_for_impersonation(user)
        account = user.account || user.accounts.first

        {
          id: user.id,
          email: user.email,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          name: user.name,
          preferred_language: user.preferred_language,
          account: account ? {
            id: account.id,
            prefix_id: account.prefix_id,
            name: account.name,
            admin: account.admin == true,
            account_type: account.account_type
          } : nil,
          impersonating: true
        }
      end

      def user_data_for_admin(user)
        account = user.account || user.accounts.first

        {
          id: user.id,
          email: user.email,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          name: user.name,
          preferred_language: user.preferred_language,
          account: account ? {
            id: account.id,
            prefix_id: account.prefix_id,
            name: account.name,
            admin: account.admin == true,
            account_type: account.account_type
          } : nil
        }
      end

      def authenticate_admin!
        return render json: {
          error: 'Acesso negado',
          message: 'Este endpoint é exclusivo para o dono do sistema (BarberManagement). Não confundir com admin de conta de cliente.'
        }, status: :forbidden unless Current.account&.admin == true
      end

      def authenticate_admin_or_impersonating!
        return render json: {
          error: 'Acesso negado',
          message: 'Este endpoint requer permissões de administrador ou estar em modo de suporte.'
        }, status: :forbidden unless Current.account&.admin == true || (Current.impersonating == true && Current.admin_account_id.present?)
      end

      def set_account
        @account = Account.find_by(id: params[:id]) || Account.find_by(prefix_id: params[:id])
        return render json: { error: 'Conta não encontrada' }, status: :not_found unless @account
      end

      def set_subscription
        @subscription = Subscription.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Assinatura não encontrada' }, status: :not_found
      end

      def account_params
        params.require(:account).permit(
          :suspended, :free, :trial, :trial_ends_at,
          :max_active_users, :max_storage_size_in_bytes,
          :subscription_status, :processor_plan_id
        )
      end

      def account_json(account)
        {
          id: account.id,
          prefix_id: account.prefix_id,
          name: account.name || account.company&.name || 'Sem nome',
          email: account.email || account.company&.email || '',
          account_type: account.account_type,
          subscription_status: account.subscription_status,
          suspended: account.suspended?,
          free: account.free?,
          trial: account.trial?,
          owner: {
            id: account.owner&.id,
            email: account.owner&.email,
            name: account.owner&.name
          },
          created_at: account.created_at,
          updated_at: account.updated_at
        }
      rescue => e
        {
          id: account.id,
          prefix_id: account.prefix_id,
          name: 'Erro ao carregar',
          email: '',
          account_type: account.account_type,
          subscription_status: account.subscription_status,
          suspended: account.suspended?,
          free: account.free?,
          trial: account.trial?,
          owner: nil,
          created_at: account.created_at,
          updated_at: account.updated_at,
          error: e.message
        }
      end

      def detailed_account_json(account)
        company_data = begin
          {
            id: account.company&.id,
            name: account.company&.name,
            email: account.company&.email,
            phone_number: account.company&.phone_number
          }
        rescue
          { id: nil, name: nil, email: nil, phone_number: nil }
        end

        subscription_data = begin
          account.subscription ? {
            id: account.subscription.id,
            processor_id: account.subscription.processor_id,
            status: account.subscription.status
          } : nil
        rescue
          nil
        end

        users_count = begin
          account.account_users_count || account.account_users.count
        rescue
          0
        end

        account_json(account).merge(
          company: company_data,
          subscription: subscription_data,
          users_count: users_count,
          transactions_count: account.transactions_count || 0,
          max_active_users: account.max_active_users || 0,
          consumed_active_users: account.consumed_active_users || 0,
          max_storage_size_in_bytes: account.max_storage_size_in_bytes || 0,
          consumed_storage_size_in_bytes: account.consumed_storage_size_in_bytes || 0,
          processor_customer_id: account.processor_customer_id,
          processor_plan_id: account.processor_plan_id,
          processor_plan_name: account.processor_plan_name
        )
      rescue => e
        account_json(account).merge(error: e.message)
      end

      def detailed_subscription_json(subscription)
        plan_data = begin
          {
            id: subscription.plan_id,
            nickname: subscription.plan_nickname,
            product: subscription.plan_product
          }
        rescue
          {
            id: subscription.processor_plan_id,
            nickname: nil,
            product: subscription.processor_product_id
          }
        end

        account_data = begin
          {
            id: subscription.account.id,
            prefix_id: subscription.account.prefix_id,
            name: subscription.account.name,
            email: subscription.account.email
          }
        rescue
          {
            id: subscription.account_id,
            prefix_id: nil,
            name: nil,
            email: nil
          }
        end

        {
          id: subscription.id,
          processor_id: subscription.processor_id,
          status: subscription.status,
          name: subscription.name,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end?,
          plan: plan_data,
          account: account_data,
          created_at: subscription.created_at,
          updated_at: subscription.updated_at,
          access_granted: subscription.access_granted?
        }
      rescue => e
        {
          id: subscription.id,
          processor_id: subscription.processor_id,
          status: subscription.status,
          error: e.message
        }
      end

      def user_json(user)
        {
          id: user.id,
          email: user.email,
          name: user.name,
          confirmed_at: user.confirmed_at,
          created_at: user.created_at
        }
      end

      def invoice_json(invoice)
        {
          id: invoice.id,
          processor_id: invoice.processor_id,
          status: invoice.status,
          amount: invoice.amount_cents,
          currency: invoice.currency,
          due_date: invoice.due_date,
          paid_at: invoice.paid_at,
          created_at: invoice.created_at
        }
      end

      def charge_json(charge)
        {
          id: charge.id,
          processor_id: charge.processor_id,
          status: charge.status,
          amount: charge.amount_cents,
          currency: charge.currency,
          created_at: charge.created_at
        }
      end

      def account_statistics(account)
        invoices_count = begin
          account.respond_to?(:subscription_invoices) ? account.subscription_invoices.count : 0
        rescue
          0
        end

        {
          transactions_count: account.transactions_count || 0,
          users_count: account.account_users_count || account.account_users.count,
          subscriptions_count: account.subscriptions.count,
          invoices_count: invoices_count,
          balance: {
            cents: account.balance_cents,
            currency: account.balance_currency,
            formatted: account.balance.format
          }
        }
      rescue => e
        {
          transactions_count: 0,
          users_count: 0,
          subscriptions_count: 0,
          invoices_count: 0,
          balance: {
            cents: 0,
            currency: 'BRL',
            formatted: 'R$ 0,00'
          },
          error: e.message
        }
      end
    end
  end
end
