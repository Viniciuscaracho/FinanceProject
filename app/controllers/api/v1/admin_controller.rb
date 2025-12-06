# frozen_string_literal: true

# Controller exclusivo para o DONO DO SISTEMA (BarberManagement)
# 
# IMPORTANTE: Não confundir com admin de conta de cliente!
# 
# - account.admin (boolean) = conta do dono do sistema (BarberManagement)
# - account_user.role = admin = usuário admin dentro de uma conta de cliente
# 
# Apenas contas com admin: true podem acessar estes endpoints.
# Estes endpoints permitem gerenciar TODAS as contas do sistema em produção.

module Api
  module V1
    class AdminController < ApplicationController
      before_action :authenticate_admin!, except: [:stop_impersonating]
      before_action :authenticate_admin_or_impersonating!, only: [:stop_impersonating]
      before_action :set_account, only: [:account_details, :update_account, :suspend_account, :activate_account, :account_subscriptions, :impersonate]
      before_action :set_subscription, only: [:subscription_details, :update_subscription, :cancel_subscription, :reactivate_subscription]

      # GET /api/v1/admin/accounts
      # Lista todas as contas do sistema
      def accounts
        begin
          per_page = [params[:per_page]&.to_i || 50, 200].min
          
          accounts = Account.includes(:owner, :company, :subscription)
                           .order(created_at: :desc)
                           .page(params[:page] || 1)
                           .per(per_page)
          
          # Filtros opcionais
          accounts = accounts.where(account_type_cd: Account::ACCOUNT_TYPES[params[:account_type]&.to_sym]) if params[:account_type].present? && Account::ACCOUNT_TYPES[params[:account_type]&.to_sym]
          accounts = accounts.where(subscription_status: params[:subscription_status]) if params[:subscription_status].present?
          accounts = accounts.where(suspended: params[:suspended] == 'true') if params[:suspended].present?
          accounts = accounts.where(free: params[:free] == 'true') if params[:free].present?
          accounts = accounts.where(admin: params[:admin] == 'true') if params[:admin].present?
          
          # Busca por email ou nome da empresa
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
            active_subscriptions: begin
              # ACCESS_GRANTING_STATUSES são símbolos [:trialing, :active, :past_due]
              # Mas no banco são strings, então precisamos converter
              statuses = Subscription::ACCESS_GRANTING_STATUSES.map(&:to_s)
              Account.joins(:subscription).where(subscriptions: { status: statuses }).count
            rescue => e
              Rails.logger.warn "Erro ao contar assinaturas ativas: #{e.message}"
              0
            end,
            suspended_accounts: Account.where(suspended: true).count,
            free_accounts: Account.where(free: true).count
          }
        }
        rescue => e
          Rails.logger.error "Erro em admin/accounts: #{e.class}: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: {
            error: 'Internal Server Error',
            message: e.message,
            details: Rails.env.development? ? e.backtrace.first(5) : nil
          }, status: :internal_server_error
        end
      end

      # GET /api/v1/admin/accounts/:id
      # Detalhes completos de uma conta
      def account_details
        begin
          render json: {
            account: detailed_account_json(@account),
            subscription: @account.subscription ? detailed_subscription_json(@account.subscription) : nil,
            users: @account.account_users.includes(:user).map { |au| user_json(au.user) },
            statistics: account_statistics(@account)
          }
        rescue => e
          Rails.logger.error "Erro em admin/account_details: #{e.class}: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: {
            error: 'Internal Server Error',
            message: e.message,
            details: Rails.env.development? ? e.backtrace.first(5) : nil
          }, status: :internal_server_error
        end
      end

      # PATCH /api/v1/admin/accounts/:id
      # Atualiza uma conta
      def update_account
        if @account.update(account_params)
          render json: {
            success: true,
            account: detailed_account_json(@account)
          }
        else
          render json: {
            success: false,
            errors: @account.errors.full_messages
          }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/admin/accounts/:id/suspend
      # Suspende uma conta
      def suspend_account
        @account.update!(suspended: true)
        render json: {
          success: true,
          message: 'Conta suspensa com sucesso',
          account: detailed_account_json(@account)
        }
      end

      # POST /api/v1/admin/accounts/:id/activate
      # Ativa uma conta suspensa
      def activate_account
        @account.update!(suspended: false)
        render json: {
          success: true,
          message: 'Conta ativada com sucesso',
          account: detailed_account_json(@account)
        }
      end

      # GET /api/v1/admin/accounts/:id/subscriptions
      # Lista todas as assinaturas de uma conta
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

      # GET /api/v1/admin/subscriptions
      # Lista todas as assinaturas do sistema
      def subscriptions
        begin
          per_page = [params[:per_page]&.to_i || 50, 200].min
          
          subscriptions = Subscription.includes(:account, account: [:owner, :company])
                                     .order(created_at: :desc)
                                     .page(params[:page] || 1)
                                     .per(per_page)
          
          # Filtros opcionais
          subscriptions = subscriptions.where(status: params[:status]) if params[:status].present?
          subscriptions = subscriptions.where(account_id: params[:account_id]) if params[:account_id].present?
          
          # Busca por email ou nome da empresa
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
              active: begin
                statuses = Subscription::ACCESS_GRANTING_STATUSES.map(&:to_s)
                Subscription.where(status: statuses).count
              rescue => e
                Rails.logger.warn "Erro ao contar assinaturas ativas: #{e.message}"
                0
              end,
              canceled: Subscription.where(status: 'canceled').count,
              past_due: Subscription.where(status: 'past_due').count,
              trialing: Subscription.where(status: 'trialing').count
            }
          }
        rescue => e
          Rails.logger.error "Erro em admin/subscriptions: #{e.class}: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: {
            error: 'Internal Server Error',
            message: e.message,
            details: Rails.env.development? ? e.backtrace.first(5) : nil
          }, status: :internal_server_error
        end
      end

      # GET /api/v1/admin/subscriptions/:id
      # Detalhes completos de uma assinatura
      def subscription_details
        render json: {
          subscription: detailed_subscription_json(@subscription),
          account: detailed_account_json(@subscription.account),
          invoices: @subscription.subscription_invoices.order(created_at: :desc).limit(10).map { |inv| invoice_json(inv) },
          charges: @subscription.subscription_charges.order(created_at: :desc).limit(10).map { |ch| charge_json(ch) }
        }
      end

      # POST /api/v1/admin/subscriptions
      # Cria uma nova assinatura para uma conta
      def create_subscription
        account = Account.find(params[:account_id])
        plan_id = params[:plan_id]
        
        unless plan_id.present?
          render json: { error: 'plan_id é obrigatório' }, status: :bad_request
          return
        end

        begin
          BarberManagement::Stripe::Client.with_api_key do
            # Verificar se o plano existe
            price = ::Stripe::Price.retrieve(plan_id)
            
            # Criar ou recuperar customer no Stripe
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

            # Criar assinatura no Stripe
            stripe_subscription = ::Stripe::Subscription.create(
              customer: customer_id,
              items: [{ price: plan_id }],
              metadata: {
                account_id: account.id,
                account_prefix_id: account.prefix_id,
                created_by: 'admin',
                admin_user_id: Current.user.id
              }
            )

            # Sincronizar com o banco de dados
            subscription = account.subscriptions.find_or_initialize_by(processor_id: stripe_subscription.id)
            subscription.sync!(stripe_subscription)
            
            # Atualizar atributos da conta
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
          Rails.logger.error "Error creating subscription: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: {
            success: false,
            error: 'Erro ao criar assinatura',
            message: e.message
          }, status: :internal_server_error
        end
      end

      # PATCH /api/v1/admin/subscriptions/:id
      # Atualiza uma assinatura
      def update_subscription
        begin
          BarberManagement::Stripe::Client.with_api_key do
            stripe_subscription = ::Stripe::Subscription.retrieve(@subscription.processor_id)
            
            # Atualizar no Stripe se necessário
            update_params = {}
            update_params[:cancel_at_period_end] = params[:cancel_at_period_end] if params[:cancel_at_period_end].present?
            
            if params[:plan_id].present?
              # Mudar plano
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

            # Sincronizar com o banco
            updated_subscription = ::Stripe::Subscription.retrieve(@subscription.processor_id)
            @subscription.sync!(updated_subscription)
            
            # Atualizar atributos da conta
            @subscription.account.assign_subscription_attributes(@subscription)
            @subscription.account.save!

            render json: {
              success: true,
              message: 'Assinatura atualizada com sucesso',
              subscription: detailed_subscription_json(@subscription)
            }
          end
        rescue StandardError => e
          Rails.logger.error "Error updating subscription: #{e.message}"
          render json: {
            success: false,
            error: 'Erro ao atualizar assinatura',
            message: e.message
          }, status: :internal_server_error
        end
      end

      # POST /api/v1/admin/subscriptions/:id/cancel
      # Cancela uma assinatura imediatamente ou ao final do período
      def cancel_subscription
        cancel_immediately = params[:immediately] == 'true'
        
        begin
          BarberManagement::Stripe::Client.with_api_key do
            if cancel_immediately
              # Cancelar imediatamente
              ::Stripe::Subscription.delete(@subscription.processor_id)
              @subscription.update!(status: :canceled)
            else
              # Cancelar ao final do período
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
          Rails.logger.error "Error canceling subscription: #{e.message}"
          render json: {
            success: false,
            error: 'Erro ao cancelar assinatura',
            message: e.message
          }, status: :internal_server_error
        end
      end

      # POST /api/v1/admin/subscriptions/:id/reactivate
      # Reativa uma assinatura cancelada
      def reactivate_subscription
        begin
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
          Rails.logger.error "Error reactivating subscription: #{e.message}"
          render json: {
            success: false,
            error: 'Erro ao reativar assinatura',
            message: e.message
          }, status: :internal_server_error
        end
      end

      # GET /api/v1/admin/dashboard
      # Dashboard administrativo com estatísticas gerais
      def dashboard
        begin
          render json: {
            summary: {
              total_accounts: Account.count,
              total_users: User.count,
              total_subscriptions: Subscription.count,
              active_subscriptions: begin
                statuses = Subscription::ACCESS_GRANTING_STATUSES.map(&:to_s)
                Subscription.where(status: statuses).count
              rescue => e
                Rails.logger.warn "Erro ao contar assinaturas ativas no dashboard: #{e.message}"
                0
              end,
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
          Rails.logger.error "Erro em admin/dashboard: #{e.class}: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: {
            error: 'Internal Server Error',
            message: e.message,
            details: Rails.env.development? ? e.backtrace.first(5) : nil
          }, status: :internal_server_error
        end
      end

      # POST /api/v1/admin/accounts/:id/impersonate
      # Entrar como usuário da conta (modo suporte)
      def impersonate
        # Encontrar o owner da conta ou primeiro usuário admin da conta
        target_user = @account.owner || @account.account_users.joins(:user).where(role_cd: AccountUser::ROLES[:admin]).first&.user
        
        unless target_user
          render json: {
            error: 'Usuário não encontrado',
            message: 'Esta conta não possui um usuário associado'
          }, status: :not_found
          return
        end

        # Gerar token com informações do admin original
        admin_user = Current.user
        admin_account = Current.account
        
        token_data = {
          user_id: target_user.id,
          email: target_user.email,
          exp: 24.hours.from_now.to_i,
          impersonating: true,
          admin_user_id: admin_user.id,
          admin_account_id: admin_account.id
        }
        
        token = Base64.strict_encode64(token_data.to_json)
        
        # Retornar dados do usuário alvo e token
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

      # POST /api/v1/admin/stop_impersonating
      # Sair do modo suporte e voltar ao perfil do admin
      def stop_impersonating
        # Verificar se está realmente em modo de suporte
        token = request.headers['Authorization']&.gsub(/^Bearer /, '')
        
        unless token
          render json: { error: 'Token não fornecido' }, status: :unauthorized
          return
        end

        begin
          decoded_token = JSON.parse(Base64.strict_decode64(token))
          
          unless decoded_token['impersonating'] && decoded_token['admin_user_id']
            render json: { error: 'Não está em modo de suporte' }, status: :bad_request
            return
          end

          # Buscar o admin original
          admin_user = User.find_by(id: decoded_token['admin_user_id'])
          admin_account = Account.find_by(id: decoded_token['admin_account_id'])
          
          unless admin_user && admin_account
            render json: { error: 'Admin original não encontrado' }, status: :not_found
            return
          end

          # Gerar novo token para o admin
          token_data = {
            user_id: admin_user.id,
            email: admin_user.email,
            exp: 24.hours.from_now.to_i
          }
          
          new_token = Base64.strict_encode64(token_data.to_json)
          
          render json: {
            success: true,
            user: user_data_for_admin(admin_user),
            token: new_token
          }
        rescue JSON::ParserError, ArgumentError => e
          render json: { error: 'Token inválido' }, status: :unauthorized
        end
      end

      private

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
        # IMPORTANTE: Esta verificação é para o DONO DO SISTEMA (BarberManagement)
        # NÃO confundir com admin de conta de cliente (AccountUser com role: admin)
        # 
        # account.admin (boolean) = conta do dono do sistema
        # account_user.role = admin = usuário admin dentro de uma conta de cliente
        #
        # Apenas contas com admin: true podem acessar estes endpoints
        unless Current.account&.admin == true
          render json: {
            error: 'Acesso negado',
            message: 'Este endpoint é exclusivo para o dono do sistema (BarberManagement). Não confundir com admin de conta de cliente.'
          }, status: :forbidden
        end
      end

      def authenticate_admin_or_impersonating!
        # Permite acesso se for admin OU se estiver em modo de suporte
        is_admin_account = Current.account&.admin == true
        is_impersonating = Current.impersonating == true && Current.admin_account_id.present?
        
        unless is_admin_account || is_impersonating
          render json: {
            error: 'Acesso negado',
            message: 'Este endpoint requer permissões de administrador ou estar em modo de suporte.'
          }, status: :forbidden
        end
      end

      def set_account
        @account = Account.find_by(id: params[:id]) || Account.find_by(prefix_id: params[:id])
        unless @account
          render json: { error: 'Conta não encontrada' }, status: :not_found
          return
        end
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
        begin
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
          Rails.logger.error "Erro ao serializar conta #{account.id}: #{e.message}"
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
      end

      def detailed_account_json(account)
        begin
          base_data = account_json(account)
          
          company_data = begin
            {
              id: account.company&.id,
              name: account.company&.name,
              email: account.company&.email,
              phone_number: account.company&.phone_number
            }
          rescue => e
            Rails.logger.warn "Erro ao obter dados da empresa para conta #{account.id}: #{e.message}"
            { id: nil, name: nil, email: nil, phone_number: nil }
          end
          
          subscription_data = begin
            account.subscription ? {
              id: account.subscription.id,
              processor_id: account.subscription.processor_id,
              status: account.subscription.status
            } : nil
          rescue => e
            Rails.logger.warn "Erro ao obter dados da assinatura para conta #{account.id}: #{e.message}"
            nil
          end
          
          base_data.merge({
            company: company_data,
            subscription: subscription_data,
            users_count: begin
              account.account_users_count || account.account_users.count
            rescue => e
              Rails.logger.warn "Erro ao contar usuários da conta #{account.id}: #{e.message}"
              0
            end,
            transactions_count: account.transactions_count || 0,
            max_active_users: account.max_active_users || 0,
            consumed_active_users: account.consumed_active_users || 0,
            max_storage_size_in_bytes: account.max_storage_size_in_bytes || 0,
            consumed_storage_size_in_bytes: account.consumed_storage_size_in_bytes || 0,
            processor_customer_id: account.processor_customer_id,
            processor_plan_id: account.processor_plan_id,
            processor_plan_name: account.processor_plan_name
          })
        rescue => e
          Rails.logger.error "Erro em detailed_account_json para conta #{account.id}: #{e.message}"
          account_json(account).merge({
            error: e.message
          })
        end
      end

      def detailed_subscription_json(subscription)
        begin
          plan_data = begin
            {
              id: subscription.plan_id,
              nickname: subscription.plan_nickname,
              product: subscription.plan_product
            }
          rescue => e
            Rails.logger.warn "Erro ao obter dados do plan para subscription #{subscription.id}: #{e.message}"
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
          rescue => e
            Rails.logger.warn "Erro ao obter dados da conta para subscription #{subscription.id}: #{e.message}"
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
          Rails.logger.error "Erro em detailed_subscription_json: #{e.message}"
          {
            id: subscription.id,
            processor_id: subscription.processor_id,
            status: subscription.status,
            error: e.message
          }
        end
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
        begin
          {
            transactions_count: account.transactions_count || 0,
            users_count: account.account_users_count || account.account_users.count,
            subscriptions_count: account.subscriptions.count,
            invoices_count: begin
              account.respond_to?(:subscription_invoices) ? account.subscription_invoices.count : 0
            rescue => e
              Rails.logger.warn "Erro ao contar invoices: #{e.message}"
              0
            end,
            balance: {
              cents: account.balance_cents,
              currency: account.balance_currency,
              formatted: account.balance.format
            }
          }
        rescue => e
          Rails.logger.error "Erro em account_statistics: #{e.message}"
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
end

